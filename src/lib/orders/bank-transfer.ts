import "server-only";

import { db } from "@/lib/db";
import { deleteStoredFile } from "@/lib/storage";

/**
 * Admin decisions on bank-transfer orders. Used by the admin server actions
 * (src/actions/admin/orders.ts); the admin panel will call those.
 */

export type BankTransferResult = { ok: true } | { ok: false; error: "notFound" | "notPending" };

/** The transfer arrived: PENDING → PAID. */
export async function confirmBankTransfer(orderNumber: string, adminId: string): Promise<BankTransferResult> {
  const order = await db.order.findFirst({
    where: { orderNumber, paymentMethod: "BANK_TRANSFER" },
    select: { id: true, transferReference: true },
  });
  if (!order) return { ok: false, error: "notFound" };

  return db.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "PAID", paymentRef: order.transferReference ?? `BANK-${orderNumber}` },
    });
    if (updated.count !== 1) return { ok: false, error: "notPending" } as const;
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: "PAID", note: `bank_transfer_confirmed:${adminId}` },
    });
    return { ok: true } as const;
  });
}

/** The receipt is unreadable or wrong: remove it so the customer can upload again. */
export async function rejectTransferReceipt(orderNumber: string, adminId: string): Promise<BankTransferResult> {
  const order = await db.order.findFirst({
    where: { orderNumber, paymentMethod: "BANK_TRANSFER", status: "PENDING" },
    select: { id: true, receiptPath: true },
  });
  if (!order) return { ok: false, error: "notPending" };
  await db.order.update({
    where: { id: order.id },
    data: { receiptPath: null, receiptUploadedAt: null, transferReference: null },
  });
  await db.orderStatusHistory.create({
    data: { orderId: order.id, status: "PENDING", note: `receipt_rejected:${adminId}` },
  });
  if (order.receiptPath) await deleteStoredFile(order.receiptPath);
  return { ok: true };
}
