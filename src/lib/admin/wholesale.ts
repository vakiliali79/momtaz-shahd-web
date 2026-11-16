import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { skipTake, type ListParams } from "@/lib/admin/list-params";

import type { WholesaleStatus } from "@/lib/admin/wholesale-statuses";

export { wholesaleStatuses, type WholesaleStatus } from "@/lib/admin/wholesale-statuses";
export const wholesaleSorts = ["createdAt", "companyName", "status"] as const;
export type WholesaleSort = (typeof wholesaleSorts)[number];

export type AdminWholesaleRow = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  city: string;
  status: WholesaleStatus;
  createdAt: string;
};

export async function listWholesaleRequests(
  params: ListParams<WholesaleSort>,
  filters: { status?: WholesaleStatus },
): Promise<{ rows: AdminWholesaleRow[]; total: number }> {
  const q = params.q;
  const where: Prisma.WholesaleRequestWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(q
      ? { OR: [{ companyName: { contains: q } }, { contactName: { contains: q } }, { phone: { contains: q } }, { city: { contains: q } }] }
      : {}),
  };
  const [requests, total] = await Promise.all([
    db.wholesaleRequest.findMany({
      where,
      orderBy: [{ [params.sort]: params.desc ? "desc" : "asc" }, { id: "asc" }],
      ...skipTake(params),
      select: { id: true, companyName: true, contactName: true, phone: true, city: true, status: true, createdAt: true },
    }),
    db.wholesaleRequest.count({ where }),
  ]);
  return { total, rows: requests.map((request) => ({ ...request, createdAt: request.createdAt.toISOString() })) };
}

export async function getWholesaleRequest(id: string) {
  const request = await db.wholesaleRequest.findUnique({ where: { id } });
  if (!request) return null;
  const account = await db.user.findUnique({ where: { phone: request.phone }, select: { id: true, role: true } });
  return {
    ...request,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    account,
  };
}
