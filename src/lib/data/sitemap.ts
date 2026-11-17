import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db";

/** Public, indexable records for sitemap.xml (cached; refreshed with the catalogue). */
export async function getSitemapEntries() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog", "dealers");

  const [products, categories, dealers] = await Promise.all([
    db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ select: { slug: true } }),
    db.dealer.findMany({ where: { isActive: true }, select: { id: true, createdAt: true } }),
  ]);
  return {
    products: products.map((product) => ({ slug: product.slug, updatedAt: product.updatedAt.toISOString() })),
    categories: categories.map((category) => category.slug),
    dealers: dealers.map((dealer) => ({ id: dealer.id, createdAt: dealer.createdAt.toISOString() })),
  };
}
