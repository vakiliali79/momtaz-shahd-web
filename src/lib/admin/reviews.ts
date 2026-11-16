import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { AppLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { skipTake, type ListParams } from "@/lib/admin/list-params";
import { localize } from "@/lib/localized";

export const reviewSorts = ["createdAt", "rating"] as const;
export type ReviewSort = (typeof reviewSorts)[number];
export const reviewStateFilters = ["pending", "approved"] as const;
export const reviewRatingFilters = ["1", "2", "3", "4", "5"] as const;

export type AdminReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  productName: string;
  productSlug: string;
  customerName: string;
  customerId: string;
};

export async function listAdminReviews(
  params: ListParams<ReviewSort>,
  filters: { state?: (typeof reviewStateFilters)[number]; rating?: (typeof reviewRatingFilters)[number] },
  locale: AppLocale,
): Promise<{ rows: AdminReviewRow[]; total: number }> {
  const q = params.q;
  const where: Prisma.ReviewWhereInput = {
    ...(filters.state ? { isApproved: filters.state === "approved" } : {}),
    ...(filters.rating ? { rating: Number(filters.rating) } : {}),
    ...(q ? { OR: [{ comment: { contains: q } }, { user: { name: { contains: q } } }, { user: { phone: { contains: q } } }] } : {}),
  };
  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: [{ [params.sort]: params.desc ? "desc" : "asc" }, { id: "asc" }],
      ...skipTake(params),
      include: { product: { select: { name: true, slug: true } }, user: { select: { id: true, name: true, phone: true } } },
    }),
    db.review.count({ where }),
  ]);
  return {
    total,
    rows: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      isApproved: review.isApproved,
      createdAt: review.createdAt.toISOString(),
      productName: localize(review.product.name, locale),
      productSlug: review.product.slug,
      customerName: review.user.name ?? review.user.phone,
      customerId: review.user.id,
    })),
  };
}
