import "server-only";

import { createTranslator } from "next-intl";
import { getMessages } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import type { OrderStatusId } from "@/lib/orders/status";
import { sendSms } from "@/lib/sms";
import type faMessages from "../../../messages/fa.json";

type SmsMessages = { sms: (typeof faMessages)["sms"] };

function isSmsMessages(messages: Record<string, unknown>): messages is SmsMessages {
  return typeof messages.sms === "object" && messages.sms !== null;
}

/** Texts the customer about their order, in their preferred language. */
export async function notifyOrderCustomer(
  orderId: string,
  event: { type: "status"; status: OrderStatusId } | { type: "tracking"; code: string },
): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { orderNumber: true, user: { select: { phone: true, preferredLocale: true } } },
  });
  if (!order) return;
  const locale = routing.locales.find((code) => code === order.user.preferredLocale) ?? routing.defaultLocale;
  const messages = await getMessages({ locale });
  if (!isSmsMessages(messages)) return;
  // A small translator over just the SMS texts keeps the key types simple.
  const t = createTranslator({ locale, messages: { sms: messages.sms }, namespace: "sms" });
  const message =
    event.type === "status"
      ? t(`status.${event.status}`, { orderNumber: order.orderNumber })
      : t("tracking", { orderNumber: order.orderNumber, code: event.code });
  await sendSms(order.user.phone, message);
}
