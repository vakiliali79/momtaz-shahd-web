"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { categorySchema } from "@/lib/admin/category-schema";
import { firstIssue, type AdminResult } from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

const idSchema = z.string().min(1).max(64);

export async function saveCategory(id: unknown, input: unknown): Promise<AdminResult<{ id: string }>> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const targetId = id === null ? null : idSchema.safeParse(id).data;
  if (id !== null && !targetId) return { ok: false, error: "notFound" };

  const { images, ...rest } = parsed.data;
  const owner = await db.category.findUnique({ where: { slug: rest.slug }, select: { id: true } });
  if (owner && owner.id !== targetId) return { ok: false, error: "slugTaken", field: "slug" };

  const data = { ...rest, image: images[0] ?? null };
  try {
    const saved = targetId
      ? await db.category.update({ where: { id: targetId }, data, select: { id: true } })
      : await db.category.create({ data, select: { id: true } });
    updateTag("catalog");
    return { ok: true, data: { id: saved.id } };
  } catch (error) {
    console.error("[admin] saveCategory failed:", error);
    return { ok: false, error: "server" };
  }
}

/** Deletes an empty category; categories with products are refused. */
export async function deleteCategory(id: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "notFound" };
  const products = await db.product.count({ where: { categoryId: parsed.data } });
  if (products > 0) return { ok: false, error: "inUse" };
  const deleted = await db.category.deleteMany({ where: { id: parsed.data } });
  if (deleted.count !== 1) return { ok: false, error: "notFound" };
  updateTag("catalog");
  return { ok: true };
}
