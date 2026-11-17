import "server-only";

import type { OrderStatus, Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Statuses an order can still be cancelled from (goods not shipped yet). */
export const CANCELLABLE_STATUSES: readonly OrderStatus[] = ["PENDING", "PAID", "PROCESSING"];

/**
 * Cancels a pending order inside a transaction: returns its items to stock
 * and gives back the coupon use. Does nothing (returns false) if the order
 * is no longer pending, so calling it twice is harmless.
 */
export async function cancelPendingOrder(tx: Tx, orderId: string, note: string): Promise<boolean> {
  return cancelOrder(tx, orderId, note, ["PENDING"]);
}

/**
 * Cancels an order that is still in one of `from` and restores stock and the
 * coupon use. Returns false (and changes nothing) otherwise. Refunds of paid
 * orders are handled outside the shop (gateway panel or bank).
 */
export async function cancelOrder(
  tx: Tx,
  orderId: string,
  note: string,
  from: readonly OrderStatus[] = CANCELLABLE_STATUSES,
): Promise<boolean> {
  const cancelled = await tx.order.updateMany({
    where: { id: orderId, status: { in: [...from] } },
    data: { status: "CANCELLED" },
  });
  if (cancelled.count !== 1) return false;

  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { couponCode: true, items: { select: { productId: true, quantity: true } } },
  });
  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
  if (order.couponCode) {
    await tx.coupon.updateMany({
      where: { code: order.couponCode, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  }
  await tx.orderStatusHistory.create({ data: { orderId, status: "CANCELLED", note } });
  return true;
}
