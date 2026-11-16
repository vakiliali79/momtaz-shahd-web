"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { firstIssue, type AdminResult } from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { confirmBankTransfer, rejectTransferReceipt } from "@/lib/orders/bank-transfer";
import { cancelOrder } from "@/lib/orders/cancel";
import { notifyOrderCustomer } from "@/lib/orders/notify";
import { ORDER_NUMBER_PATTERN } from "@/lib/orders/order-number-pattern";
import { allowedNextStatuses, orderStatuses } from "@/lib/orders/status";
import { getAdminUser } from "@/lib/session";

const orderNumberSchema = z.string().regex(ORDER_NUMBER_PATTERN);

const statusChangeSchema = z.object({
  orderNumber: orderNumberSchema,
  status: z.enum(orderStatuses),
  /** Internal note, kept in the history but never shown to the customer. */
  note: z.string().trim().max(500, "tooLong"),
  notify: z.boolean(),
});

/**
 * Moves an order to the next status (see src/lib/orders/status.ts), records
 * it in the history and, if asked, texts the customer. Cancelling before
 * shipment returns stock and the coupon use.
 */
export async function changeOrderStatus(input: unknown): Promise<AdminResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "forbidden" };
  const parsed = statusChangeSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const { orderNumber, status, note, notify } = parsed.data;

  const order = await db.order.findUnique({ where: { orderNumber }, select: { id: true, status: true } });
  if (!order) return { ok: false, error: "notFound" };
  if (!allowedNextStatuses(order.status).includes(status)) return { ok: false, error: "invalid" };

  const historyNote = `admin:${admin.id}${note ? `:${note}` : ""}`;
  const changed = await db.$transaction(async (tx) => {
    if (status === "CANCELLED") return cancelOrder(tx, order.id, historyNote, [order.status]);
    const updated = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data: { status } });
    if (updated.count !== 1) return false;
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status, note: historyNote } });
    return true;
  });
  // Someone else changed it in the meantime.
  if (!changed) return { ok: false, error: "invalid" };
  if (status === "CANCELLED") revalidateTag("catalog", "max");
  if (notify) await notifyOrderCustomer(order.id, { type: "status", status });
  return { ok: true };
}

const trackingSchema = z.object({
  orderNumber: orderNumberSchema,
  code: z.string().trim().min(1, "required").max(64, "tooLong").regex(/^[A-Za-z0-9-]+$/, "invalid"),
  notify: z.boolean(),
});

export async function setTrackingCode(input: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = trackingSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const { orderNumber, code, notify } = parsed.data;
  const order = await db.order.findUnique({ where: { orderNumber }, select: { id: true } });
  if (!order) return { ok: false, error: "notFound" };
  await db.order.update({ where: { id: order.id }, data: { trackingCode: code } });
  if (notify) await notifyOrderCustomer(order.id, { type: "tracking", code });
  return { ok: true };
}

/** Admin: the bank transfer for this order has arrived (→ PAID, customer texted). */
export async function confirmBankTransferAction(orderNumber: unknown): Promise<AdminResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "forbidden" };
  const parsed = orderNumberSchema.safeParse(orderNumber);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const result = await confirmBankTransfer(parsed.data, admin.id);
  if (!result.ok) return { ok: false, error: result.error === "notFound" ? "notFound" : "invalid" };
  const order = await db.order.findUnique({ where: { orderNumber: parsed.data }, select: { id: true } });
  if (order) await notifyOrderCustomer(order.id, { type: "status", status: "PAID" });
  return { ok: true };
}

/** Admin: the uploaded receipt is not acceptable; the customer may upload again. */
export async function rejectTransferReceiptAction(orderNumber: unknown): Promise<AdminResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "forbidden" };
  const parsed = orderNumberSchema.safeParse(orderNumber);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const result = await rejectTransferReceipt(parsed.data, admin.id);
  return result.ok ? { ok: true } : { ok: false, error: "invalid" };
}
