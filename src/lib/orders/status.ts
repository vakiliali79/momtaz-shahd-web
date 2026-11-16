/** Order status workflow, shared by the admin UI and its server actions. */
export const orderStatuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatusId = (typeof orderStatuses)[number];

const NEXT: Record<OrderStatusId, readonly OrderStatusId[]> = {
  PENDING: ["PAID", "PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function allowedNextStatuses(status: OrderStatusId): readonly OrderStatusId[] {
  return NEXT[status];
}
