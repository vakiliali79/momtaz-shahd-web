import "server-only";

import type { AppLocale } from "@/i18n/routing";
import { resolveImage } from "@/lib/data/images";
import { db } from "@/lib/db";
import { localize, toLocalizedText } from "@/lib/localized";
import type { ListParams } from "@/lib/admin/list-params";

export const productSorts = ["name", "category", "price", "stock", "createdAt"] as const;
export type ProductSort = (typeof productSorts)[number];
export const productStatusFilters = ["active", "inactive"] as const;
export const productStockFilters = ["low", "out"] as const;
export const LOW_STOCK = 10;

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  image: string;
  categoryName: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
};

/**
 * One page of products for the admin table. Structured filters run in SQL;
 * search across the three languages and sorting run here, because JSON
 * text search differs between SQLite and PostgreSQL. Fine for a catalogue
 * of up to a few thousand products.
 */
export async function listAdminProducts(
  params: ListParams<ProductSort>,
  filters: { category?: string; status?: "active" | "inactive"; stock?: "low" | "out" },
  locale: AppLocale,
): Promise<{ rows: AdminProductRow[]; total: number }> {
  const products = await db.product.findMany({
    where: {
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.status ? { isActive: filters.status === "active" } : {}),
      ...(filters.stock === "out" ? { stock: { lte: 0 } } : filters.stock === "low" ? { stock: { gt: 0, lte: LOW_STOCK } } : {}),
    },
    include: { category: { select: { name: true } } },
  });

  const query = params.q.toLowerCase();
  const rows = products
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      name: localize(product.name, locale),
      search: `${product.slug} ${Object.values(toLocalizedText(product.name)).join(" ")}`.toLowerCase(),
      image: resolveImage(Array.isArray(product.images) ? product.images[0] : null),
      categoryName: localize(product.category.name, locale),
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt.toISOString(),
    }))
    .filter((row) => !query || row.search.includes(query));

  const collator = new Intl.Collator(locale);
  const direction = params.desc ? -1 : 1;
  rows.sort((a, b) => {
    switch (params.sort) {
      case "name":
        return collator.compare(a.name, b.name) * direction;
      case "category":
        return collator.compare(a.categoryName, b.categoryName) * direction;
      case "price":
        return (a.price - b.price) * direction;
      case "stock":
        return (a.stock - b.stock) * direction;
      default:
        return a.createdAt.localeCompare(b.createdAt) * direction;
    }
  });

  const start = (params.page - 1) * params.pageSize;
  return {
    total: rows.length,
    rows: rows.slice(start, start + params.pageSize).map(({ search, ...row }) => row),
  };
}

export async function getCategoryOptions(locale: AppLocale) {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    label: localize(category.name, locale),
  }));
}

export async function getProductForEdit(id: string) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return null;
  return {
    id: product.id,
    slug: product.slug,
    categoryId: product.categoryId,
    name: toLocalizedText(product.name),
    description: toLocalizedText(product.description),
    ingredients: toLocalizedText(product.ingredients),
    price: product.price,
    discountPrice: product.discountPrice,
    wholesalePrice: product.wholesalePrice,
    minWholesaleQty: product.minWholesaleQty,
    weightGrams: product.weightGrams,
    stock: product.stock,
    shelfLifeDays: product.shelfLifeDays,
    images: Array.isArray(product.images)
      ? product.images.filter((image): image is string => typeof image === "string")
      : [],
    isActive: product.isActive,
    isFeatured: product.isFeatured,
  };
}
