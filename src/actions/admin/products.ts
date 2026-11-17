"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { productSchema } from "@/lib/admin/product-schema";
import { count, firstIssue, type AdminResult } from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

const idSchema = z.string().min(1).max(64);

/** Creates (id null) or updates a product. Returns its id. */
export async function saveProduct(id: unknown, input: unknown): Promise<AdminResult<{ id: string }>> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const data = parsed.data;
  const targetId = id === null ? null : idSchema.safeParse(id).data;
  if (id !== null && !targetId) return { ok: false, error: "notFound" };

  const [category, slugOwner] = await Promise.all([
    db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }),
    db.product.findUnique({ where: { slug: data.slug }, select: { id: true } }),
  ]);
  if (!category) return { ok: false, error: "required", field: "categoryId" };
  if (slugOwner && slugOwner.id !== targetId) return { ok: false, error: "slugTaken", field: "slug" };

  try {
    const saved = targetId
      ? await db.product.update({ where: { id: targetId }, data, select: { id: true } })
      : await db.product.create({ data, select: { id: true } });
    updateTag("catalog");
    return { ok: true, data: { id: saved.id } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "notFound" };
    }
    console.error("[admin] saveProduct failed:", error);
    return { ok: false, error: "server" };
  }
}

export async function setProductStock(id: unknown, stock: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsedId = idSchema.safeParse(id);
  const parsedStock = count.safeParse(stock);
  if (!parsedId.success) return { ok: false, error: "notFound" };
  if (!parsedStock.success) return firstIssue(parsedStock.error.issues);
  const updated = await db.product.updateMany({ where: { id: parsedId.data }, data: { stock: parsedStock.data } });
  if (updated.count !== 1) return { ok: false, error: "notFound" };
  updateTag("catalog");
  return { ok: true };
}

export async function setProductActive(id: unknown, active: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success || typeof active !== "boolean") return { ok: false, error: "invalid" };
  const updated = await db.product.updateMany({ where: { id: parsedId.data }, data: { isActive: active } });
  if (updated.count !== 1) return { ok: false, error: "notFound" };
  updateTag("catalog");
  return { ok: true };
}

/** Copies a product (inactive, with a new slug) and returns the copy's id. */
export async function duplicateProduct(id: unknown): Promise<AdminResult<{ id: string }>> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "notFound" };
  const source = await db.product.findUnique({ where: { id: parsedId.data } });
  if (!source) return { ok: false, error: "notFound" };

  let slug = `${source.slug}-copy`;
  for (let n = 2; await db.product.findUnique({ where: { slug }, select: { id: true } }); n++) {
    slug = `${source.slug}-copy-${n}`;
  }
  const { id: _id, createdAt, updatedAt, ...rest } = source;
  const copy = await db.product.create({
    data: {
      ...rest,
      slug,
      isActive: false,
      isFeatured: false,
      name: rest.name ?? Prisma.JsonNull,
      description: rest.description ?? Prisma.JsonNull,
      ingredients: rest.ingredients ?? Prisma.JsonNull,
      images: rest.images ?? [],
    },
    select: { id: true },
  });
  updateTag("catalog");
  return { ok: true, data: { id: copy.id } };
}
