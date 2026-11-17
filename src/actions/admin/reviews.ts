"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import type { AdminResult } from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

const idSchema = z.string().min(1).max(64);

/** Publishes a review on the product page (and in its average rating). */
export async function approveReview(id: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "notFound" };
  const updated = await db.review.updateMany({ where: { id: parsed.data }, data: { isApproved: true } });
  if (updated.count !== 1) return { ok: false, error: "notFound" };
  updateTag("reviews");
  updateTag("catalog");
  return { ok: true };
}

/** Rejecting deletes the review, so the customer may write a new one. */
export async function rejectReview(id: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "notFound" };
  const deleted = await db.review.deleteMany({ where: { id: parsed.data } });
  if (deleted.count !== 1) return { ok: false, error: "notFound" };
  updateTag("reviews");
  updateTag("catalog");
  return { ok: true };
}
