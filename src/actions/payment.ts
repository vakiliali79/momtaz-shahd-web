"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { ORDER_NUMBER_REGEX } from "@/lib/orders/queries";
import { getPaymentGateway } from "@/lib/payments";
import { getSessionUser } from "@/lib/session";

const mockPaymentSchema = z.object({
  orderNumber: z.string().regex(ORDER_NUMBER_REGEX),
  outcome: z.enum(["success", "failure"]),
  locale: z.enum(routing.locales),
});

/**
 * Result of the simulated gateway (development only). A real gateway would
 * instead call back a route handler that verifies the payment with the
 * provider before marking the order as paid.
 */
export async function finishMockPayment(formData: FormData): Promise<void> {
  const parsed = mockPaymentSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    outcome: formData.get("outcome"),
    locale: formData.get("locale"),
  });
  const user = await getSessionUser();
  if (!parsed.success || !user || getPaymentGateway() !== "mock") {
    redirect(`/${routing.defaultLocale}`);
  }
  const { orderNumber, outcome, locale } = parsed.data;
  const base = `/${locale}/checkout`;

  const order = await db.order.findFirst({
    where: { orderNumber, userId: user.id, paymentMethod: "ONLINE" },
    select: { id: true, status: true },
  });
  if (!order || order.status !== "PENDING") redirect(`${base}/success/${orderNumber}`);

  if (outcome === "failure") {
    await db.orderStatusHistory.create({
      data: { orderId: order.id, status: "PENDING", note: "payment_failed" },
    });
    redirect(`${base}/failed/${orderNumber}`);
  }

  // Only flips PENDING → PAID once, even if the button is pressed twice.
  const updated = await db.order.updateMany({
    where: { id: order.id, status: "PENDING" },
    data: { status: "PAID", paymentRef: `MOCK-${randomBytes(4).toString("hex").toUpperCase()}` },
  });
  if (updated.count === 1) {
    await db.orderStatusHistory.create({
      data: { orderId: order.id, status: "PAID", note: "payment_received" },
    });
  }
  redirect(`${base}/success/${orderNumber}`);
}
