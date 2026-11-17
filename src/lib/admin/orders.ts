import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { skipTake, type ListParams } from "@/lib/admin/list-params";
import { orderStatuses } from "@/lib/orders/status";

export const orderSorts = ["createdAt", "total", "orderNumber", "status"] as const;
export type OrderSort = (typeof orderSorts)[number];
export const orderTypeFilters = ["RETAIL", "WHOLESALE"] as const;
export const orderPaymentFilters = ["ONLINE", "COD", "BANK_TRANSFER"] as const;
export const orderPeriodFilters = ["today", "7d", "30d"] as const;
export { orderStatuses as orderStatusFilters };

export type AdminOrderRow = {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  type: "RETAIL" | "WHOLESALE";
  paymentMethod: "ONLINE" | "COD" | "BANK_TRANSFER";
  total: number;
  status: (typeof orderStatuses)[number];
  hasReceipt: boolean;
};

/** Start of today in Tehran, as a UTC instant. */
export function startOfTehranDay(date = new Date()): Date {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  // Iran has used a fixed UTC+03:30 offset since 2022.
  return new Date(`${day}T00:00:00+03:30`);
}

export async function listAdminOrders(
  params: ListParams<OrderSort>,
  filters: {
    status?: (typeof orderStatuses)[number];
    type?: (typeof orderTypeFilters)[number];
    payment?: (typeof orderPaymentFilters)[number];
    period?: (typeof orderPeriodFilters)[number];
  },
): Promise<{ rows: AdminOrderRow[]; total: number }> {
  const since =
    filters.period === "today"
      ? startOfTehranDay()
      : filters.period === "7d"
        ? new Date(Date.now() - 7 * 86_400_000)
        : filters.period === "30d"
          ? new Date(Date.now() - 30 * 86_400_000)
          : undefined;
  const q = params.q;
  const where: Prisma.OrderWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.payment ? { paymentMethod: filters.payment } : {}),
    ...(since ? { createdAt: { gte: since } } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q.toUpperCase() } },
            { user: { phone: { contains: q } } },
            { user: { name: { contains: q } } },
          ],
        }
      : {}),
  };
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { [params.sort]: params.desc ? "desc" : "asc" },
      ...skipTake(params),
      include: { user: { select: { name: true, phone: true } } },
    }),
    db.order.count({ where }),
  ]);
  return {
    total,
    rows: orders.map((order) => ({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      customerName: order.user.name ?? "",
      customerPhone: order.user.phone,
      type: order.type,
      paymentMethod: order.paymentMethod,
      total: Number(order.total),
      status: order.status,
      hasReceipt: order.receiptPath !== null,
    })),
  };
}

/** Customer, payment attempts and raw history notes for the admin order page. */
export async function getAdminOrderExtras(orderNumber: string) {
  const order = await db.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      user: { select: { id: true, name: true, phone: true, email: true, role: true } },
      payments: { orderBy: { createdAt: "desc" }, select: { id: true, gateway: true, status: true, refId: true, amount: true, createdAt: true } },
    },
  });
  if (!order) return null;
  return {
    id: order.id,
    customer: order.user,
    payments: order.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
      createdAt: payment.createdAt.toISOString(),
    })),
  };
}
