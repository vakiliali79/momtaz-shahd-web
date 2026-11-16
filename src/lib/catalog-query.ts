import { z } from "zod";

import type { CatalogProduct } from "@/lib/data/catalog";
import { normalizeSearchText } from "@/lib/search-text";

export const PAGE_SIZE = 12;

export const sortOptions = [
  "newest",
  "price-asc",
  "price-desc",
  "rating",
] as const;
export type SortOption = (typeof sortOptions)[number];

const first = (value: unknown): unknown => (Array.isArray(value) ? value[0] : value);

const optionalInt = z.preprocess(
  first,
  z.coerce.number().int().min(0).max(1_000_000_000).optional().catch(undefined),
);

/** Validates raw URL search params; anything invalid falls back to a default. */
export const catalogParamsSchema = z.object({
  q: z.preprocess(first, z.string().trim().max(100).catch("")).default(""),
  category: z
    .preprocess(
      (value) =>
        (Array.isArray(value) ? value.join(",") : typeof value === "string" ? value : "")
          .split(",")
          .map((slug) => slug.trim())
          .filter(Boolean),
      z.array(z.string().regex(/^[a-z0-9-]+$/)).max(20).catch([]),
    )
    .default([]),
  min: optionalInt,
  max: optionalInt,
  stock: z.preprocess(first, z.literal("1").optional().catch(undefined)),
  sort: z.preprocess(first, z.enum(sortOptions).catch("newest")).default("newest"),
  page: z.preprocess(first, z.coerce.number().int().min(1).max(999).catch(1)).default(1),
});

export type CatalogParams = z.infer<typeof catalogParamsSchema>;

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseCatalogParams(raw: RawSearchParams): CatalogParams {
  return catalogParamsSchema.parse(raw);
}

/** Serialises params back to a query object, omitting defaults. */
export function toCatalogQuery(params: Partial<CatalogParams>): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.q) query.q = params.q;
  if (params.category && params.category.length > 0) {
    query.category = params.category.join(",");
  }
  if (params.min !== undefined) query.min = String(params.min);
  if (params.max !== undefined) query.max = String(params.max);
  if (params.stock) query.stock = "1";
  if (params.sort && params.sort !== "newest") query.sort = params.sort;
  if (params.page && params.page > 1) query.page = String(params.page);
  return query;
}

export function countActiveFilters(params: CatalogParams): number {
  return (
    params.category.length +
    (params.min !== undefined || params.max !== undefined ? 1 : 0) +
    (params.stock ? 1 : 0)
  );
}

export type CatalogResult = {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
};

export function queryCatalog(
  products: readonly CatalogProduct[],
  params: CatalogParams,
): CatalogResult {
  const terms = normalizeSearchText(params.q).split(" ").filter(Boolean);

  const filtered = products.filter((product) => {
    if (params.category.length > 0 && !params.category.includes(product.categorySlug)) {
      return false;
    }
    if (params.min !== undefined && product.effectivePrice < params.min) return false;
    if (params.max !== undefined && product.effectivePrice > params.max) return false;
    if (params.stock && product.stock <= 0) return false;
    return terms.every((term) => product.searchText.includes(term));
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (params.sort) {
      case "price-asc":
        return a.effectivePrice - b.effectivePrice;
      case "price-desc":
        return b.effectivePrice - a.effectivePrice;
      case "rating":
        return (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount;
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, pageCount);

  return {
    items: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total,
    page,
    pageCount,
  };
}

/** Price slider bounds, rounded outwards to the step. */
export function getPriceBounds(
  products: readonly CatalogProduct[],
  step = 10_000,
): { min: number; max: number; step: number } {
  if (products.length === 0) return { min: 0, max: step, step };
  const prices = products.map((product) => product.effectivePrice);
  return {
    min: Math.floor(Math.min(...prices) / step) * step,
    max: Math.ceil(Math.max(...prices) / step) * step,
    step,
  };
}
