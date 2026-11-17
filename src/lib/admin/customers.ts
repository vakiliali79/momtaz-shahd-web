import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { skipTake, type ListParams } from "@/lib/admin/list-params";

export const customerSorts = ["createdAt", "name", "orders"] as const;
export type CustomerSort = (typeof customerSorts)[number];
export const customerRoleFilters = ["CUSTOMER", "WHOLESALE", "ADMIN"] as const;
export type CustomerRole = (typeof customerRoleFilters)[number];
export const customerStateFilters = ["active", "blocked"] as const;

export type AdminCustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: CustomerRole;
  isBlocked: boolean;
  orderCount: number;
  createdAt: string;
};

export async function listAdminCustomers(
  params: ListParams<CustomerSort>,
  filters: { role?: CustomerRole; state?: (typeof customerStateFilters)[number] },
): Promise<{ rows: AdminCustomerRow[]; total: number }> {
  const q = params.q;
  const where: Prisma.UserWhereInput = {
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.state ? { isBlocked: filters.state === "blocked" } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q.toLowerCase() } }] } : {}),
  };
  const direction = params.desc ? "desc" : "asc";
  const orderBy: Prisma.UserOrderByWithRelationInput =
    params.sort === "orders" ? { orders: { _count: direction } } : { [params.sort]: direction };
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [orderBy, { id: "asc" }],
      ...skipTake(params),
      select: {
        id: true, name: true, phone: true, email: true, role: true, isBlocked: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    db.user.count({ where }),
  ]);
  return {
    total,
    rows: users.map((user) => ({
      id: user.id,
      name: user.name ?? "",
      phone: user.phone,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      orderCount: user._count.orders,
      createdAt: user.createdAt.toISOString(),
    })),
  };
}

export async function getAdminCustomer(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, phone: true, email: true, role: true, isBlocked: true, preferredLocale: true, createdAt: true,
      addresses: { select: { id: true, title: true, province: true, city: true, fullAddress: true, postalCode: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { orderNumber: true, createdAt: true, status: true, total: true, type: true },
      },
      _count: { select: { orders: true, reviews: true } },
    },
  });
  if (!user) return null;
  const spent = await db.order.aggregate({
    where: { userId: id, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
    _sum: { total: true },
  });
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    totalSpent: Number(spent._sum.total ?? 0),
    orders: user.orders.map((order) => ({ ...order, createdAt: order.createdAt.toISOString(), total: Number(order.total) })),
  };
}
