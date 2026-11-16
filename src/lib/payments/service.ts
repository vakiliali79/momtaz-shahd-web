import "server-only";

import { after } from "next/server";

import { revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";

import { Prisma } from "@/generated/prisma/client";
import { routing, type AppLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { notifyOrderCustomer } from "@/lib/notifications";
import { cancelPendingOrder } from "@/lib/orders/cancel";
import { allGateways, getGatewayById, getPaymentGateway } from "@/lib/payments";
import type { PaymentVerifyResult } from "@/lib/payments/types";
import { getAppOrigin } from "@/lib/site";

export function toLocale(value: string | null | undefined): AppLocale {
  return routing.locales.find((locale) => locale === value) ?? routing.defaultLocale;
}

const paths = (locale: AppLocale, orderNumber: string) => ({
  success: `/${locale}/checkout/success/${orderNumber}`,
  failed: `/${locale}/checkout/failed/${orderNumber}`,
  verifying: `/${locale}/checkout/pay/${orderNumber}?status=verifying`,
  pay: `/${locale}/checkout/pay/${orderNumber}`,
});

export type StartPaymentResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: "unavailable" | "notPayable" | "request" };

/**
 * Asks the active gateway for a new payment for a pending online order and
 * records the attempt. Each call creates a new attempt (retries are fine).
 */
export async function startOnlinePayment(orderId: string, locale: AppLocale): Promise<StartPaymentResult> {
  const gateway = getPaymentGateway();
  if (!gateway) return { ok: false, error: "unavailable" };

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, total: true, status: true, paymentMethod: true },
  });
  if (!order || order.paymentMethod !== "ONLINE" || order.status !== "PENDING") {
    return { ok: false, error: "notPayable" };
  }

  const t = await getTranslations({ locale, namespace: "payment" });
  const amount = Number(order.total);
  const callbackUrl = `${getAppOrigin()}/api/payment/callback?locale=${locale}`;
  const result = await gateway.request(
    amount,
    order.orderNumber,
    callbackUrl,
    t("gatewayDescription", { orderNumber: order.orderNumber }),
  );
  if (!result.ok) {
    console.error(`[payments] ${gateway.id} request failed for ${order.orderNumber}:`, result.error);
    return { ok: false, error: "request" };
  }

  await db.payment.create({
    data: {
      orderId: order.id,
      gateway: gateway.id,
      amount: BigInt(amount),
      authority: result.authority,
      gatewayData: result.raw === undefined ? Prisma.JsonNull : (result.raw as Prisma.InputJsonValue),
    },
  });
  return { ok: true, redirectUrl: result.redirectUrl };
}

type PaymentWithOrder = {
  id: string;
  gateway: string;
  amount: bigint;
  authority: string;
  status: "PENDING" | "PAID" | "FAILED";
  order: { id: string; orderNumber: string };
};

/**
 * Verifies a payment attempt with its gateway and applies the outcome.
 * Idempotent: an attempt is settled once (PENDING → PAID/FAILED, guarded by
 * conditional updates), and repeated or concurrent calls only redirect.
 * Returns the page to send the customer to.
 */
async function settlePayment(
  payment: PaymentWithOrder,
  params: URLSearchParams,
  locale: AppLocale,
): Promise<string> {
  const to = paths(locale, payment.order.orderNumber);
  if (payment.status === "PAID") return to.success;
  if (payment.status === "FAILED") return to.failed;

  const gateway = getGatewayById(payment.gateway);
  if (!gateway) return to.verifying;

  let result: PaymentVerifyResult;
  try {
    result = await gateway.verify(params, Number(payment.amount));
  } catch (error) {
    result = { status: "error", reason: error instanceof Error ? error.message : "verify_threw" };
  }
  const raw = (value: unknown) =>
    value === undefined || value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

  if (result.status === "error") {
    console.error(`[payments] Could not verify ${payment.authority}:`, result.reason);
    return to.verifying;
  }

  if (result.status === "paid") {
    const paid = result;
    let markedPaid = false;
    await db.$transaction(async (tx) => {
      const settled = await tx.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: {
          status: "PAID",
          refId: paid.refId,
          cardPan: paid.cardPan,
          verifiedAt: new Date(),
          gatewayData: raw(paid.raw),
        },
      });
      if (settled.count !== 1) return; // settled by a concurrent callback
      const order = await tx.order.updateMany({
        where: { id: payment.order.id, status: "PENDING" },
        data: { status: "PAID", paymentRef: paid.refId },
      });
      if (order.count === 1) {
        markedPaid = true;
        await tx.orderStatusHistory.create({
          data: { orderId: payment.order.id, status: "PAID", note: "payment_received" },
        });
      } else {
        // Money arrived for an order that is no longer pending (cancelled,
        // or already paid by another attempt): flag it for a refund.
        const current = await tx.order.findUniqueOrThrow({
          where: { id: payment.order.id },
          select: { status: true },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.order.id,
            status: current.status,
            note: `payment_needs_review:${paid.refId}`,
          },
        });
      }
    });
    if (markedPaid) {
      const orderId = payment.order.id;
      after(() => notifyOrderCustomer(orderId, { type: "status", status: "PAID" }));
    }
    return to.success;
  }

  const failed = result;
  let cancelled = false;
  await db.$transaction(async (tx) => {
    const settled = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "FAILED", verifiedAt: new Date(), gatewayData: raw(failed.raw) },
    });
    if (settled.count !== 1) return;
    cancelled = await cancelPendingOrder(tx, payment.order.id, `payment_failed:${failed.reason}`);
  });
  // Stock went back on sale.
  if (cancelled) revalidateTag("catalog", "max");
  return to.failed;
}

const paymentSelect = {
  id: true,
  gateway: true,
  amount: true,
  authority: true,
  status: true,
  order: { select: { id: true, orderNumber: true } },
} as const;

/** Handles the customer's return from a gateway (GET or POST callback). */
export async function handlePaymentCallback(params: URLSearchParams): Promise<string> {
  const locale = toLocale(params.get("locale"));
  for (const gateway of allGateways()) {
    const authority = gateway.getAuthority(params);
    if (!authority) continue;
    const payment = await db.payment.findUnique({ where: { authority }, select: paymentSelect });
    if (payment && payment.gateway === gateway.id) return settlePayment(payment, params, locale);
  }
  return `/${locale}`;
}

/** Re-checks the latest pending attempt of an order (customer pressed "check again"). */
export async function recheckOrderPayment(orderId: string, locale: AppLocale): Promise<string | null> {
  const payment = await db.payment.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    select: paymentSelect,
  });
  if (!payment) return null;
  const gateway = getGatewayById(payment.gateway);
  if (!gateway) return null;
  return settlePayment(payment, gateway.buildVerifyParams(payment.authority), locale);
}
