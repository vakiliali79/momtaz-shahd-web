"use server";

import { z } from "zod";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

const idSchema = z.string().min(1).max(64);
const idsSchema = z.array(idSchema).max(200);

/**
 * Merges the browser's wishlist into the signed-in user's saved wishlist and
 * returns the combined list (null when signed out).
 */
export async function syncWishlist(localIds: unknown): Promise<string[] | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const parsed = idsSchema.safeParse(localIds);
  const ids = parsed.success ? [...new Set(parsed.data)] : [];

  const existing = await db.wishlist.findMany({
    where: { userId: user.id },
    select: { productId: true },
  });
  const saved = new Set(existing.map((row) => row.productId));
  const missing = ids.filter((id) => !saved.has(id));

  if (missing.length > 0) {
    const products = await db.product.findMany({
      where: { id: { in: missing }, isActive: true },
      select: { id: true },
    });
    for (const { id } of products) {
      // Tolerates a concurrent insert of the same pair.
      await db.wishlist
        .create({ data: { userId: user.id, productId: id } })
        .catch(() => undefined);
      saved.add(id);
    }
  }
  return [...saved];
}

export async function setWishlisted(productId: unknown, on: unknown): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  const id = idSchema.safeParse(productId);
  if (!user || !id.success || typeof on !== "boolean") return { ok: false };

  try {
    if (on) {
      const product = await db.product.findUnique({ where: { id: id.data }, select: { id: true } });
      if (!product) return { ok: false };
      await db.wishlist.upsert({
        where: { userId_productId: { userId: user.id, productId: id.data } },
        update: {},
        create: { userId: user.id, productId: id.data },
      });
    } else {
      await db.wishlist.deleteMany({ where: { userId: user.id, productId: id.data } });
    }
    return { ok: true };
  } catch (error) {
    console.error("[wishlist] Update failed:", error);
    return { ok: false };
  }
}
