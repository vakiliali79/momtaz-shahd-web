"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { cancelPendingOrder } from "@/lib/orders/cancel";
import { ORDER_NUMBER_PATTERN } from "@/lib/orders/order-number-pattern";
import { getSessionUser } from "@/lib/session";

export type CancelOrderResult = { ok: true } | { ok: false; error: "notAllowed" | "unauthorized" | "server" };

/**
 * Customer cancels their own order while it is still PENDING (not after a
 * bank-transfer receipt was uploaded). Stock and the coupon use are restored.
 * Pending online payment attempts are left as they are: if the customer did
 * pay meanwhile, the gateway callback still verifies it and flags the order
 * for a refund.
 */
export async function cancelMyOrder(orderNumber: unknown): Promise<CancelOrderResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const parsed = z.string().regex(ORDER_NUMBER_PATTERN).safeParse(orderNumber);
  if (!parsed.success) return { ok: false, error: "notAllowed" };

  const order = await db.order.findFirst({
    where: { orderNumber: parsed.data, userId: user.id },
    select: { id: true, status: true, paymentMethod: true, receiptPath: true },
  });
  if (
    !order ||
    order.status !== "PENDING" ||
    (order.paymentMethod === "BANK_TRANSFER" && order.receiptPath !== null)
  ) {
    return { ok: false, error: "notAllowed" };
  }

  try {
    const cancelled = await db.$transaction((tx) =>
      cancelPendingOrder(tx, order.id, "cancelled_by_customer"),
    );
    if (!cancelled) return { ok: false, error: "notAllowed" };
    revalidateTag("catalog", "max");
    return { ok: true };
  } catch (error) {
    console.error("[orders] Cancel failed:", error);
    return { ok: false, error: "server" };
  }
}
