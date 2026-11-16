import "server-only";

import { createTranslator } from "next-intl";
import { getMessages } from "next-intl/server";

import { routing, type AppLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { sendAdminEmail } from "@/lib/email";
import { formatNumber } from "@/lib/format";
import type { OrderStatusId } from "@/lib/orders/status";
import { sendSms } from "@/lib/sms";
import type faMessages from "../../../messages/fa.json";

/**
 * Text messages to customers (in their language) and alerts to the shop
 * team (in Persian, by SMS to ADMIN_NOTIFY_PHONES and email to ADMIN_EMAIL).
 * Templates live in the `sms` and `notifications` namespaces of
 * messages/*.json, so they can be edited in Admin → Translations.
 * Nothing here throws: a failed notification never fails an order.
 */

type NotificationMessages = Pick<typeof faMessages, "sms" | "notifications">;

function hasNotificationMessages(messages: Record<string, unknown>): messages is NotificationMessages {
  return typeof messages.sms === "object" && messages.sms !== null && typeof messages.notifications === "object" && messages.notifications !== null;
}

async function translator(locale: AppLocale) {
  const messages = await getMessages({ locale });
  if (!hasNotificationMessages(messages)) return null;
  // A small translator over just these texts keeps the key types simple.
  return createTranslator({ locale, messages: { sms: messages.sms, notifications: messages.notifications } });
}

function asLocale(value: string | null | undefined): AppLocale {
  return routing.locales.find((code) => code === value) ?? routing.defaultLocale;
}

function adminPhones(): string[] {
  return (process.env.ADMIN_NOTIFY_PHONES ?? "")
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean);
}

async function alertAdmins(subject: string, text: string, sms: string) {
  await Promise.all([sendAdminEmail({ subject, text }), ...adminPhones().map((phone) => sendSms(phone, sms))]);
}

export type OrderEvent =
  | { type: "placed" }
  | { type: "status"; status: OrderStatusId }
  | { type: "tracking"; code: string };

/** Texts the customer about their order, in their preferred language. */
export async function notifyOrderCustomer(orderId: string, event: OrderEvent): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, total: true, status: true, user: { select: { phone: true, preferredLocale: true } } },
    });
    if (!order) return;
    const locale = asLocale(order.user.preferredLocale);
    const t = await translator(locale);
    if (!t) return;
    const values = { orderNumber: order.orderNumber };
    const message =
      event.type === "placed"
        ? order.status === "PROCESSING"
          ? t("sms.placedCod", { ...values, total: formatNumber(Number(order.total), locale) })
          : t("sms.placed", { ...values, total: formatNumber(Number(order.total), locale) })
        : event.type === "status"
          ? t(`sms.status.${event.status}`, values)
          : t("sms.tracking", { ...values, code: event.code });
    await sendSms(order.user.phone, message);
  } catch (error) {
    console.error("[notify] Customer notification failed:", error);
  }
}

/** Tells the shop team about a new order. */
export async function notifyAdminsNewOrder(orderId: string): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true, total: true, type: true, paymentMethod: true,
        user: { select: { name: true, phone: true } },
        _count: { select: { items: true } },
      },
    });
    const t = await translator("fa");
    if (!order || !t) return;
    const values = {
      orderNumber: order.orderNumber,
      total: formatNumber(Number(order.total), "fa"),
      customer: order.user.name ?? order.user.phone,
      phone: order.user.phone,
      type: t(`notifications.orderTypes.${order.type}`),
      payment: t(`notifications.payments.${order.paymentMethod}`),
      items: formatNumber(order._count.items, "fa"),
    };
    await alertAdmins(t("notifications.newOrder.subject", values), t("notifications.newOrder.body", values), t("notifications.newOrder.sms", values));
  } catch (error) {
    console.error("[notify] Admin order alert failed:", error);
  }
}

/** Thanks the visitor for a wholesale/dealer request and alerts the shop team. */
export async function notifyNewWholesaleRequest(requestId: string): Promise<void> {
  try {
    const request = await db.wholesaleRequest.findUnique({ where: { id: requestId } });
    if (!request) return;
    const [visitor, team] = await Promise.all([translator(asLocale(request.locale)), translator("fa")]);
    if (visitor) {
      await sendSms(request.phone, visitor(request.type === "AGENCY" ? "sms.dealerReceived" : "sms.wholesaleReceived", { name: request.contactName }));
    }
    if (!team) return;
    const values = {
      kind: team(`notifications.requestTypes.${request.type}`),
      company: request.companyName,
      contact: request.contactName,
      phone: request.phone,
      email: request.email ?? "—",
      city: request.city,
      products: request.products,
      quantity: request.estimatedQty ?? "—",
      message: request.message ?? "—",
    };
    await alertAdmins(team("notifications.newRequest.subject", values), team("notifications.newRequest.body", values), team("notifications.newRequest.sms", values));
  } catch (error) {
    console.error("[notify] Wholesale request alert failed:", error);
  }
}
