import "server-only";

import type { AppLocale } from "@/i18n/routing";
import { getCatalog, type CatalogProduct } from "@/lib/data/catalog";
import { db } from "@/lib/db";
import { localize } from "@/lib/localized";
import type { AddressDto } from "@/lib/orders/types";

/** Data for the account pages. Every function is scoped to one user. */

export type OrderSummary = {
  orderNumber: string;
  createdAt: string;
  total: number;
  status: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  itemCount: number;
};

const orderSummarySelect = {
  orderNumber: true,
  createdAt: true,
  total: true,
  status: true,
  items: { select: { quantity: true } },
} as const;

function toSummary(order: {
  orderNumber: string;
  createdAt: Date;
  total: bigint;
  status: OrderSummary["status"];
  items: { quantity: number }[];
}): OrderSummary {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    total: Number(order.total),
    status: order.status,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export const addressSelect = {
  id: true,
  title: true,
  province: true,
  city: true,
  fullAddress: true,
  postalCode: true,
  receiverName: true,
  receiverPhone: true,
  lat: true,
  lng: true,
  isDefault: true,
} as const;

export async function getDashboard(userId: string) {
  const [orderCount, lastOrder, defaultAddress, wishlistCount] = await Promise.all([
    db.order.count({ where: { userId } }),
    db.order.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: orderSummarySelect,
    }),
    db.address.findFirst({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
      select: addressSelect,
    }),
    db.wishlist.count({ where: { userId } }),
  ]);
  return {
    orderCount,
    lastOrder: lastOrder ? toSummary(lastOrder) : null,
    defaultAddress: defaultAddress satisfies AddressDto | null,
    wishlistCount,
  };
}

export async function listOrders(userId: string): Promise<OrderSummary[]> {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: orderSummarySelect,
  });
  return orders.map(toSummary);
}

export async function listAddresses(userId: string): Promise<AddressDto[]> {
  return db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    select: addressSelect,
  });
}

/** Active wishlisted products, in the order they were added (newest first). */
export async function getWishlistProducts(userId: string, locale: AppLocale): Promise<CatalogProduct[]> {
  const [rows, catalog] = await Promise.all([
    db.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { productId: true },
    }),
    getCatalog(locale),
  ]);
  const byId = new Map(catalog.products.map((product) => [product.id, product]));
  return rows.flatMap(({ productId }) => {
    const product = byId.get(productId);
    return product ? [product] : [];
  });
}

export type MyReview = {
  id: string;
  productName: string;
  productSlug: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
};

export async function listMyReviews(userId: string, locale: AppLocale): Promise<MyReview[]> {
  const reviews = await db.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true } } },
  });
  return reviews.map((review) => ({
    id: review.id,
    productName: localize(review.product.name, locale),
    productSlug: review.product.slug,
    rating: review.rating,
    comment: review.comment ?? "",
    isApproved: review.isApproved,
    createdAt: review.createdAt.toISOString(),
  }));
}

/** Products the user has received but not reviewed yet. */
export async function listReviewableProducts(userId: string, locale: AppLocale) {
  const items = await db.orderItem.findMany({
    where: {
      order: { userId, status: "DELIVERED" },
      product: { isActive: true, reviews: { none: { userId } } },
    },
    distinct: ["productId"],
    select: { product: { select: { id: true, slug: true, name: true } } },
  });
  return items.map(({ product }) => ({
    id: product.id,
    slug: product.slug,
    name: localize(product.name, locale),
  }));
}

/** Whether the user may review this product (received it in a delivered order). */
export async function canReviewProduct(userId: string, productId: string): Promise<boolean> {
  const item = await db.orderItem.findFirst({
    where: { productId, order: { userId, status: "DELIVERED" } },
    select: { id: true },
  });
  return item !== null;
}

/**
 * Wholesale requests sent with this user's phone number. The request form is
 * public, so requests are matched to accounts by phone.
 */
export async function listWholesaleRequests(phone: string) {
  const requests = await db.wholesaleRequest.findMany({
    where: { phone },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return requests.map((request) => ({
    id: request.id,
    companyName: request.companyName,
    products: request.products,
    estimatedQty: request.estimatedQty,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
  }));
}
