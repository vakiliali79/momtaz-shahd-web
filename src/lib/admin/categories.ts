import "server-only";

import type { AppLocale } from "@/i18n/routing";
import { resolveImage } from "@/lib/data/images";
import { db } from "@/lib/db";
import { localize, toLocalizedText } from "@/lib/localized";

export async function listAdminCategories(locale: AppLocale) {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: localize(category.name, locale),
    image: resolveImage(category.image),
    sortOrder: category.sortOrder,
    productCount: category._count.products,
  }));
}

export async function getCategoryForEdit(id: string) {
  const category = await db.category.findUnique({ where: { id } });
  if (!category) return null;
  return {
    id: category.id,
    slug: category.slug,
    name: toLocalizedText(category.name),
    description: toLocalizedText(category.description),
    images: category.image ? [category.image] : [],
    sortOrder: category.sortOrder,
  };
}
