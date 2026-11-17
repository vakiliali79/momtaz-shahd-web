"use server";

import { z } from "zod";

import { couponSchema, expiryInstant } from "@/lib/admin/coupon-schema";
import { firstIssue, type AdminResult } from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

const idSchema = z.string().min(1).max(64);

export async function saveCoupon(id: unknown, input: unknown): Promise<AdminResult<{ id: string }>> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const targetId = id === null ? null : idSchema.safeParse(id).data;
  if (id !== null && !targetId) return { ok: false, error: "notFound" };

  const { expiresAt, ...rest } = parsed.data;
  const owner = await db.coupon.findUnique({ where: { code: rest.code }, select: { id: true } });
  if (owner && owner.id !== targetId) return { ok: false, error: "codeTaken", field: "code" };
  const data = { ...rest, expiresAt: expiresAt ? expiryInstant(expiresAt) : null };
  try {
    const saved = targetId
      ? await db.coupon.update({ where: { id: targetId }, data, select: { id: true } })
      : await db.coupon.create({ data, select: { id: true } });
    return { ok: true, data: { id: saved.id } };
  } catch (error) {
    console.error("[admin] saveCoupon failed:", error);
    return { ok: false, error: "server" };
  }
}

export async function setCouponActive(id: unknown, active: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = z.object({ id: idSchema, active: z.boolean() }).safeParse({ id, active });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const updated = await db.coupon.updateMany({ where: { id: parsed.data.id }, data: { isActive: parsed.data.active } });
  return updated.count === 1 ? { ok: true } : { ok: false, error: "notFound" };
}

/** Orders keep the code as text, so deleting a used coupon leaves them intact. */
export async function deleteCoupon(id: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "notFound" };
  const deleted = await db.coupon.deleteMany({ where: { id: parsed.data } });
  return deleted.count === 1 ? { ok: true } : { ok: false, error: "notFound" };
}
