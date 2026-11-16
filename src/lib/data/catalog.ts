import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { AppLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { localize } from "@/lib/localized";
import { normalizeSearchText } from "@/lib/search-text";

import { resolveImage, resolveImages } from "./images";

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  ingredients: string;
  /** Lower-cased text in all languages, used for search. */
  searchText: string;
  categorySlug: string;
  categoryName: string;
  price: number;
  discountPrice: number | null;
  /** What the customer pays: the discount price when on sale. */
  effectivePrice: number;
  wholesalePrice: number | null;
  minWholesaleQty: number | null;
  weightGrams: number;
  stock: number;
  images: string[];
  shelfLifeDays: number | null;
  isFeatured: boolean;
  createdAt: string;
  /** Average of approved reviews, or null when there are none. */
  rating: number | null;
  reviewCount: number;
};

export type Catalog = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
};

function allLanguages(value: unknown): string {
  if (typeof value !== "object" || value === null) return "";
  return Object.values(value)
    .filter((text): text is string => typeof text === "string")
    .join(" ");
}

/**
 * The whole active catalogue for one locale, cached and shared by every
 * storefront page. The catalogue is small (tens of products), so listing
 * pages filter, sort and paginate this in memory instead of issuing a
 * database query per request. Admin mutations should call
 * `revalidateTag("catalog")`.
 */
export async function getCatalog(locale: AppLocale): Promise<Catalog> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const [categories, products, ratings] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    db.review.groupBy({
      by: ["productId"],
      where: { isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const ratingByProduct = new Map(
    ratings.map((row) => [
      row.productId,
      { rating: row._avg.rating, count: row._count._all },
    ]),
  );
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const catalogProducts: CatalogProduct[] = products.flatMap((product) => {
    const category = categoryById.get(product.categoryId);
    if (!category) return [];
    const stats = ratingByProduct.get(product.id);
    const onSale =
      product.discountPrice !== null && product.discountPrice < product.price;

    return [
      {
        id: product.id,
        slug: product.slug,
        name: localize(product.name, locale),
        description: localize(product.description, locale),
        ingredients: localize(product.ingredients, locale),
        searchText: normalizeSearchText(
          `${allLanguages(product.name)} ${allLanguages(product.description)} ${allLanguages(category.name)}`,
        ),
        categorySlug: category.slug,
        categoryName: localize(category.name, locale),
        price: product.price,
        discountPrice: onSale ? product.discountPrice : null,
        effectivePrice: onSale ? (product.discountPrice ?? product.price) : product.price,
        wholesalePrice: product.wholesalePrice,
        minWholesaleQty: product.minWholesaleQty,
        weightGrams: product.weightGrams,
        stock: Math.max(0, product.stock),
        images: resolveImages(product.images),
        shelfLifeDays: product.shelfLifeDays,
        isFeatured: product.isFeatured,
        createdAt: product.createdAt.toISOString(),
        rating: stats?.rating ?? null,
        reviewCount: stats?.count ?? 0,
      },
    ];
  });

  return {
    categories: categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: localize(category.name, locale),
      description: localize(category.description, locale),
      image: resolveImage(category.image),
      productCount: catalogProducts.filter((p) => p.categorySlug === category.slug)
        .length,
    })),
    products: catalogProducts,
  };
}

export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};

/** Shows only the first name and family initial, e.g. "مریم ا." */
function publicName(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0] ?? "";
  return `${parts[0]} ${(parts[parts.length - 1] ?? "").charAt(0)}.`;
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("reviews");

  const reviews = await db.review.findMany({
    where: { productId, isApproved: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true } } },
  });

  return reviews.map((review) => ({
    id: review.id,
    author: publicName(review.user.name),
    rating: review.rating,
    comment: review.comment ?? "",
    createdAt: review.createdAt.toISOString(),
  }));
}

export type Testimonial = ProductReview & { productName: string; productSlug: string };

/** Best recent approved reviews with a comment, for the home page. */
export async function getTestimonials(locale: AppLocale): Promise<Testimonial[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("reviews", "catalog");

  const reviews = await db.review.findMany({
    where: {
      isApproved: true,
      rating: { gte: 4 },
      comment: { not: null },
      product: { isActive: true },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: 6,
    include: {
      user: { select: { name: true } },
      product: { select: { name: true, slug: true } },
    },
  });

  return reviews
    .filter((review) => (review.comment ?? "").trim() !== "")
    .map((review) => ({
      id: review.id,
      author: publicName(review.user.name),
      rating: review.rating,
      comment: review.comment ?? "",
      createdAt: review.createdAt.toISOString(),
      productName: localize(review.product.name, locale),
      productSlug: review.product.slug,
    }));
}

export type DealerSummary = {
  id: string;
  name: string;
  city: string;
  type: "DISTRIBUTOR" | "RETAIL_STORE" | "AGENCY";
  lat: number | null;
  lng: number | null;
  isVerified: boolean;
};

export async function getDealers(locale: AppLocale): Promise<DealerSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("dealers");

  const dealers = await db.dealer.findMany({
    where: { isActive: true },
    orderBy: [{ isVerified: "desc" }, { createdAt: "asc" }],
  });

  return dealers.map((dealer) => ({
    id: dealer.id,
    name: localize(dealer.name, locale),
    city: dealer.city,
    type: dealer.type,
    lat: dealer.lat,
    lng: dealer.lng,
    isVerified: dealer.isVerified,
  }));
}
