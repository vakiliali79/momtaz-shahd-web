import "server-only";

import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Cancels a pending order inside a transaction: returns its items to stock
 * and gives back the coupon use. Does nothing (returns false) if the order
 * is no longer pending, so calling it twice is harmless.
 */
export async function cancelPendingOrder(tx: Tx, orderId: string, note: string): Promise<boolean> {
  const cancelled = await tx.order.updateMany({
    where: { id: orderId, status: "PENDING" },
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
