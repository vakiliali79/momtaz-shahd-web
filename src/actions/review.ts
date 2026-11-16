"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { canReviewProduct } from "@/lib/account/queries";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import {
  reviewSchema,
  toReviewErrorKey,
  type ReviewErrorKey,
} from "@/lib/validation/review";

export type ReviewResult = { ok: true } | { ok: false; error: ReviewErrorKey };

/**
 * Creates or updates the user's review of a product. Only customers with a
 * delivered order containing the product may review it. Every new or edited
 * review waits for moderation before it is shown.
 */
export async function submitReview(input: unknown): Promise<ReviewResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: toReviewErrorKey(parsed.error.issues[0]?.message) };
  const { productId, rating, comment } = parsed.data;

  if (!(await canReviewProduct(user.id, productId))) return { ok: false, error: "notAllowed" };

  try {
    const existing = await db.review.findUnique({
      where: { productId_userId: { productId, userId: user.id } },
      select: { isApproved: true },
    });
    await db.review.upsert({
      where: { productId_userId: { productId, userId: user.id } },
      update: { rating, comment: comment || null, isApproved: false, createdAt: new Date() },
      create: { productId, userId: user.id, rating, comment: comment || null, isApproved: false },
    });
    // An edited review that was public goes back to moderation: refresh ratings.
    if (existing?.isApproved) revalidateTag("reviews", "max");
    return { ok: true };
  } catch (error) {
    console.error("[review] Save failed:", error);
    return { ok: false, error: "server" };
  }
}

export async function deleteMyReview(reviewId: unknown): Promise<ReviewResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const id = z.string().min(1).max(64).safeParse(reviewId);
  if (!id.success) return { ok: false, error: "server" };

  const deleted = await db.review.deleteMany({ where: { id: id.data, userId: user.id } });
  if (deleted.count !== 1) return { ok: false, error: "notAllowed" };
  revalidateTag("reviews", "max");
  revalidateTag("catalog", "max");
  return { ok: true };
}
