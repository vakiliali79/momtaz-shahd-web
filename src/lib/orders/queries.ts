import "server-only";

import { db } from "@/lib/db";
import { addressSnapshotSchema, type AddressSnapshot } from "@/lib/orders/types";
import type { ShippingMethodId } from "@/lib/shipping";
import { shippingMethodIds } from "@/lib/shipping";
import type { PaymentMethodId } from "@/lib/validation/checkout";

import { ORDER_NUMBER_PATTERN } from "@/lib/orders/order-number-pattern";

export const ORDER_NUMBER_REGEX = ORDER_NUMBER_PATTERN;

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
  items: { id: string; productId: string; productName: string; unitPrice: number; quantity: number }[];
  /** Bank transfers: when the customer uploaded a receipt (null if none). */
  receiptUploadedAt: string | null;
  transferReference: string | null;
  trackingCode: string | null;
  /** Oldest first. `note` is a machine code such as "payment_received". */
  history: { id: string; status: OrderView["status"]; note: string | null; createdAt: string }[];
};

/**
 * Customers may cancel only while the order is pending, and not after
 * uploading a bank-transfer receipt (the money may already be on its way).
 */
export function canCustomerCancel(order: Pick<OrderView, "status" | "paymentMethod" | "receiptUploadedAt">): boolean {
  return (
    order.status === "PENDING" &&
    !(order.paymentMethod === "BANK_TRANSFER" && order.receiptUploadedAt !== null)
  );
}

/** An order, only if it belongs to `userId` (null otherwise). */
export async function getOrderForUser(orderNumber: string, userId: string): Promise<OrderView | null> {
  return getOrderView(orderNumber, userId);
}

/** Any order, for admin pages (callers must check the ADMIN role first). */
export async function getOrderForAdmin(orderNumber: string): Promise<OrderView | null> {
  return getOrderView(orderNumber, null);
}

async function getOrderView(orderNumber: string, userId: string | null): Promise<OrderView | null> {
  if (!ORDER_NUMBER_REGEX.test(orderNumber)) return null;
  const order = await db.order.findFirst({
    where: { orderNumber, ...(userId ? { userId } : {}) },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
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
    receiptUploadedAt: order.receiptPath ? (order.receiptUploadedAt?.toISOString() ?? null) : null,
    transferReference: order.transferReference,
    trackingCode: order.trackingCode,
    history: order.statusHistory.map((entry) => ({
      id: entry.id,
      status: entry.status,
      note: entry.note,
      createdAt: entry.createdAt.toISOString(),
    })),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
  };
}
