import "server-only";

import type { AppLocale } from "@/i18n/routing";
import { startOfTehranDay } from "@/lib/admin/orders";
import { LOW_STOCK } from "@/lib/admin/products";
import { db } from "@/lib/db";
import { localize } from "@/lib/localized";

/** Orders that count as sales: paid online, cash on delivery being prepared, or later. */
const SOLD = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
const DAY = 86_400_000;

/** "YYYY-MM-DD" of an instant in Tehran. */
function tehranDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Start of the current Persian (Solar Hijri) month — the shop's business month. */
function startOfPersianMonth(now: Date): Date {
  const dayOfMonth = Number(
    new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", { timeZone: "Asia/Tehran", day: "numeric" }).format(now),
  );
  return new Date(startOfTehranDay(now).getTime() - (dayOfMonth - 1) * DAY);
}

export type DashboardData = {
  kpis: { today: number; month: number; pendingOrders: number; lowStock: number; newWholesale: number };
  daily: { day: string; total: number; orders: number }[];
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  latestOrders: { orderNumber: string; customer: string; total: number; status: (typeof SOLD)[number] | "PENDING" | "CANCELLED"; createdAt: string }[];
};

export async function getDashboardData(locale: AppLocale): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOfTehranDay(now);
  const monthStart = startOfPersianMonth(now);
  const chartStart = new Date(todayStart.getTime() - 29 * DAY);
  const since = monthStart < chartStart ? monthStart : chartStart;

  const [sold, pendingOrders, lowStock, newWholesale, items, latest] = await Promise.all([
    db.order.findMany({ where: { status: { in: [...SOLD] }, createdAt: { gte: since } }, select: { total: true, createdAt: true } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.product.count({ where: { isActive: true, stock: { lte: LOW_STOCK } } }),
    db.wholesaleRequest.count({ where: { status: "NEW" } }),
    db.orderItem.findMany({
      where: { order: { status: { in: [...SOLD] }, createdAt: { gte: chartStart } } },
      select: { productId: true, quantity: true, unitPrice: true, product: { select: { name: true } } },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { orderNumber: true, total: true, status: true, createdAt: true, user: { select: { name: true, phone: true } } },
    }),
  ]);

  const byDay = new Map<string, { total: number; orders: number }>();
  for (let index = 0; index < 30; index += 1) {
    byDay.set(tehranDay(new Date(chartStart.getTime() + index * DAY + DAY / 2)), { total: 0, orders: 0 });
  }
  let today = 0;
  let month = 0;
  for (const order of sold) {
    const total = Number(order.total);
    if (order.createdAt >= todayStart) today += total;
    if (order.createdAt >= monthStart) month += total;
    const bucket = byDay.get(tehranDay(order.createdAt));
    if (bucket) {
      bucket.total += total;
      bucket.orders += 1;
    }
  }

  const products = new Map<string, DashboardData["topProducts"][number]>();
  for (const item of items) {
    const entry = products.get(item.productId) ?? { productId: item.productId, name: localize(item.product.name, locale), quantity: 0, revenue: 0 };
    entry.quantity += item.quantity;
    entry.revenue += item.quantity * item.unitPrice;
    products.set(item.productId, entry);
  }

  return {
    kpis: { today, month, pendingOrders, lowStock, newWholesale },
    daily: [...byDay.entries()].map(([day, value]) => ({ day, ...value })),
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    latestOrders: latest.map((order) => ({
      orderNumber: order.orderNumber,
      customer: order.user.name ?? order.user.phone,
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    })),
  };
}
