"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { ORDER_NUMBER_REGEX } from "@/lib/orders/queries";
import { recheckOrderPayment, startOnlinePayment } from "@/lib/payments/service";
import { getSessionUser } from "@/lib/session";

const orderFormSchema = z.object({
  orderNumber: z.string().regex(ORDER_NUMBER_REGEX),
  locale: z.enum(routing.locales),
});

async function ownOrder(formData: FormData) {
  const parsed = orderFormSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    locale: formData.get("locale"),
  });
  const user = await getSessionUser();
  if (!parsed.success || !user) redirect(`/${routing.defaultLocale}`);
  const order = await db.order.findFirst({
    where: { orderNumber: parsed.data.orderNumber, userId: user.id },
    select: { id: true, orderNumber: true },
  });
  if (!order) redirect(`/${parsed.data.locale}`);
  return { order, locale: parsed.data.locale };
}

/** "Pay" button on the payment page: starts a new gateway attempt. */
export async function startPaymentAction(formData: FormData): Promise<void> {
  const { order, locale } = await ownOrder(formData);
  const result = await startOnlinePayment(order.id, locale);
  if (result.ok) redirect(result.redirectUrl);
  if (result.error === "notPayable") redirect(`/${locale}/checkout/success/${order.orderNumber}`);
  redirect(`/${locale}/checkout/pay/${order.orderNumber}?error=request`);
}

/** "Check payment status" after an unconfirmed return from the gateway. */
export async function recheckPaymentAction(formData: FormData): Promise<void> {
  const { order, locale } = await ownOrder(formData);
  const target = await recheckOrderPayment(order.id, locale);
  redirect(target ?? `/${locale}/checkout/pay/${order.orderNumber}`);
}
