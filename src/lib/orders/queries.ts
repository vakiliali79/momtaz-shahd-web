import "server-only";

import { db } from "@/lib/db";
import { addressSnapshotSchema, type AddressSnapshot } from "@/lib/orders/types";
import type { ShippingMethodId } from "@/lib/shipping";
import { shippingMethodIds } from "@/lib/shipping";
import type { PaymentMethodId } from "@/lib/validation/checkout";

export const ORDER_NUMBER_REGEX = /^MS-\d{8}-\d{4,6}$/;

export type OrderView = {
  orderNumber: string;
  status: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  type: "RETAIL" | "WHOLESALE";
  createdAt: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  couponCode: string | null;
  shippingMethod: ShippingMethodId | null;
  paymentMethod: PaymentMethodId;
  paymentRef: string | null;
  note: string | null;
  address: AddressSnapshot | null;
  items: { id: string; productName: string; unitPrice: number; quantity: number }[];
};

/** An order, only if it belongs to `userId` (null otherwise). */
export async function getOrderForUser(
  orderNumber: string,
  userId: string,
): Promise<OrderView | null> {
  if (!ORDER_NUMBER_REGEX.test(orderNumber)) return null;
  const order = await db.order.findFirst({
    where: { orderNumber, userId },
    include: { items: true },
  });
  if (!order) return null;

  const address = addressSnapshotSchema.safeParse(order.addressSnapshot);
  const method = shippingMethodIds.find((id) => id === order.shippingMethod) ?? null;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    type: order.type,
    createdAt: order.createdAt.toISOString(),
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    discount: Number(order.discount),
    total: Number(order.total),
    couponCode: order.couponCode,
    shippingMethod: method,
    paymentMethod: order.paymentMethod,
    paymentRef: order.paymentRef,
    note: order.note,
    address: address.success ? address.data : null,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
  };
}
