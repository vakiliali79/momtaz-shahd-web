import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { AppLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { effectivePrice } from "@/lib/cart";
import { getCity, getProvince } from "@/lib/locations";
import { localize, toLocalizedText, type LocalizedText } from "@/lib/localized";
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
  /** Name in every language, for the cart (which outlives a locale switch). */
  names: LocalizedText;
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
    const price = effectivePrice(product.price, product.discountPrice);

    return [
      {
        id: product.id,
        slug: product.slug,
        name: localize(product.name, locale),
        names: toLocalizedText(product.name),
        description: localize(product.description, locale),
        ingredients: localize(product.ingredients, locale),
        searchText: normalizeSearchText(
          `${allLanguages(product.name)} ${allLanguages(product.description)} ${allLanguages(category.name)}`,
        ),
        categorySlug: category.slug,
        categoryName: localize(category.name, locale),
        price: product.price,
        discountPrice: price < product.price ? price : null,
        effectivePrice: price,
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
  type: "DISTRIBUTOR" | "RETAIL_STORE" | "AGENCY";
  provinceId: string;
  province: string;
  cityId: string;
  city: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  openingHours: string | null;
  lat: number | null;
  lng: number | null;
  image: string | null;
  isVerified: boolean;
};

type DealerRow = Awaited<ReturnType<typeof db.dealer.findMany>>[number];

function toDealerSummary(dealer: DealerRow, locale: AppLocale): DealerSummary {
  const hours = localize(dealer.openingHours, locale);
  return {
    id: dealer.id,
    name: localize(dealer.name, locale),
    type: dealer.type,
    provinceId: dealer.province,
    province: getProvince(dealer.province)?.name[locale] ?? dealer.province,
    cityId: dealer.city,
    city: getCity(dealer.province, dealer.city)?.name[locale] ?? dealer.city,
    address: localize(dealer.address, locale),
    phone: dealer.phone,
    whatsapp: dealer.whatsapp,
    instagram: dealer.instagram,
    openingHours: hours || null,
    lat: dealer.lat,
    lng: dealer.lng,
    image: dealer.image,
    isVerified: dealer.isVerified,
  };
}

/** Every active dealer, verified ones first. */
export async function getDealers(locale: AppLocale): Promise<DealerSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("dealers");

  const dealers = await db.dealer.findMany({
    where: { isActive: true },
    orderBy: [{ isVerified: "desc" }, { createdAt: "asc" }],
  });
  return dealers.map((dealer) => toDealerSummary(dealer, locale));
}

/** One active dealer, or null. */
export async function getDealer(id: string, locale: AppLocale): Promise<DealerSummary | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("dealers");

  if (id.length > 64) return null;
  const dealer = await db.dealer.findFirst({ where: { id, isActive: true } });
  return dealer ? toDealerSummary(dealer, locale) : null;
}
