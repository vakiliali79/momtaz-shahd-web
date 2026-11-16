import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { AppLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { getCity, getProvince } from "@/lib/locations";
import { skipTake, type ListParams } from "@/lib/admin/list-params";

import type { WholesaleStatus } from "@/lib/admin/wholesale-statuses";

export { wholesaleStatuses, type WholesaleStatus } from "@/lib/admin/wholesale-statuses";
export const wholesaleSorts = ["createdAt", "companyName", "status"] as const;
export type WholesaleSort = (typeof wholesaleSorts)[number];

export const wholesaleTypes = ["WHOLESALE", "AGENCY"] as const;

/** City name in the admin's language; older requests stored free text. */
function placeLabel(province: string | null, city: string, locale: AppLocale): string {
  const cityName = province ? getCity(province, city)?.name[locale] : undefined;
  const provinceName = province ? getProvince(province)?.name[locale] : undefined;
  return cityName ? (provinceName && provinceName !== cityName ? `${cityName}، ${provinceName}` : cityName) : city;
}

export type AdminWholesaleRow = {
  id: string;
  type: (typeof wholesaleTypes)[number];
  companyName: string;
  contactName: string;
  phone: string;
  city: string;
  status: WholesaleStatus;
  createdAt: string;
};

export async function listWholesaleRequests(
  params: ListParams<WholesaleSort>,
  filters: { status?: WholesaleStatus; type?: (typeof wholesaleTypes)[number] },
  locale: AppLocale,
): Promise<{ rows: AdminWholesaleRow[]; total: number }> {
  const q = params.q;
  const where: Prisma.WholesaleRequestWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(q
      ? { OR: [{ companyName: { contains: q } }, { contactName: { contains: q } }, { phone: { contains: q } }, { city: { contains: q } }] }
      : {}),
  };
  const [requests, total] = await Promise.all([
    db.wholesaleRequest.findMany({
      where,
      orderBy: [{ [params.sort]: params.desc ? "desc" : "asc" }, { id: "asc" }],
      ...skipTake(params),
      select: { id: true, type: true, companyName: true, contactName: true, phone: true, province: true, city: true, status: true, createdAt: true },
    }),
    db.wholesaleRequest.count({ where }),
  ]);
  return {
    total,
    rows: requests.map(({ province, ...request }) => ({
      ...request,
      city: placeLabel(province, request.city, locale),
      createdAt: request.createdAt.toISOString(),
    })),
  };
}

export async function getWholesaleRequest(id: string, locale: AppLocale) {
  const request = await db.wholesaleRequest.findUnique({ where: { id } });
  if (!request) return null;
  const account = await db.user.findUnique({ where: { phone: request.phone }, select: { id: true, role: true } });
  return {
    ...request,
    city: placeLabel(request.province, request.city, locale),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    account,
  };
}
