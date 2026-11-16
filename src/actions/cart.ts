"use server";

import { z } from "zod";

import { effectivePrice, type AppliedCoupon, type CartProduct } from "@/lib/cart";
import { resolveImages } from "@/lib/data/images";
import { db } from "@/lib/db";
import { toLocalizedText } from "@/lib/localized";
import {
  couponRequestSchema,
  toCouponErrorKey,
  type CouponErrorKey,
} from "@/lib/validation/coupon";

const productIdsSchema = z.array(z.string().min(1).max(64)).max(100);

/**
 * Current price, stock and details for the products in a cart. Products that
 * are missing or inactive are simply absent from the result.
 */
export async function getCartProducts(productIds: unknown): Promise<CartProduct[]> {
  const parsed = productIdsSchema.safeParse(productIds);
  if (!parsed.success || parsed.data.length === 0) return [];

  const products = await db.product.findMany({
    where: { id: { in: parsed.data }, isActive: true },
  });

  return products.map((product) => ({
    productId: product.id,
    slug: product.slug,
    name: toLocalizedText(product.name),
    image: resolveImages(product.images)[0] ?? "",
    unitPrice: effectivePrice(product.price, product.discountPrice),
    wholesalePrice: product.wholesalePrice,
    minWholesaleQty: product.minWholesaleQty,
    weightGrams: product.weightGrams,
    stock: Math.max(0, product.stock),
  }));
}

export type CouponResult =
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; error: CouponErrorKey; minOrder?: number };

/**
 * Checks a discount code. The subtotal comes from the browser and is only
 * used for the minimum-order message; checkout must validate again.
 */
export async function checkCoupon(input: unknown): Promise<CouponResult> {
  const parsed = couponRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: toCouponErrorKey(parsed.error.issues[0]?.message) };
  }

  const { code, subtotal } = parsed.data;
  try {
    const coupon = await db.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) return { ok: false, error: "notFound" };
    if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) {
      return { ok: false, error: "expired" };
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return { ok: false, error: "usedUp" };
    }
    if (subtotal < coupon.minOrder) {
      return { ok: false, error: "minOrder", minOrder: coupon.minOrder };
    }
    return {
      ok: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder,
      },
    };
  } catch (error) {
    console.error("[cart] Coupon check failed:", error);
    return { ok: false, error: "server" };
  }
}
