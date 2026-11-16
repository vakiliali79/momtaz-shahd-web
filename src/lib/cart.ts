import type { CatalogProduct } from "@/lib/data/catalog";
import type { LocalizedText } from "@/lib/localized";
import { PLACEHOLDER_IMAGE } from "@/lib/site";

/**
 * Cart pricing rules, shared by the browser cart and (later) the server-side
 * checkout so both compute identical totals. All amounts are whole Toman.
 */

/** What an add-to-cart button needs to know about a product. */
export type CartProduct = {
  productId: string;
  slug: string;
  name: LocalizedText;
  image: string;
  /** Retail price the customer pays (sale price when on sale). */
  unitPrice: number;
  wholesalePrice: number | null;
  minWholesaleQty: number | null;
  weightGrams: number;
  stock: number;
};

export type CartItem = Omit<CartProduct, "stock"> & {
  quantity: number;
  /** Stock when the item was last added or synced; caps `quantity`. */
  maxStock: number;
};

export type AppliedCoupon = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrder: number;
};

export type ShippingRate = {
  id: string;
  baseCost: number;
  baseWeightGrams: number;
  perExtraKg: number;
};

export type ShippingConfig = {
  /** Active methods that deliver nationwide. */
  methods: ShippingRate[];
  /** Orders at or above this amount ship free; null when disabled. */
  freeShippingThreshold: number | null;
};

/** Sale price when it is lower than the list price, otherwise the list price. */
export function effectivePrice(price: number, discountPrice: number | null): number {
  return discountPrice !== null && discountPrice < price ? discountPrice : price;
}

export function toCartProduct(product: CatalogProduct): CartProduct {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.names,
    image: product.images[0] ?? PLACEHOLDER_IMAGE,
    unitPrice: product.effectivePrice,
    wholesalePrice: product.wholesalePrice,
    minWholesaleQty: product.minWholesaleQty,
    weightGrams: product.weightGrams,
    stock: product.stock,
  };
}

type PricedItem = Pick<CartItem, "unitPrice" | "wholesalePrice" | "minWholesaleQty">;

/** The wholesale price applies automatically from `minWholesaleQty` units. */
export function qualifiesForWholesale(item: PricedItem, quantity: number): boolean {
  return (
    item.wholesalePrice !== null &&
    item.minWholesaleQty !== null &&
    item.minWholesaleQty > 0 &&
    quantity >= item.minWholesaleQty &&
    item.wholesalePrice < item.unitPrice
  );
}

export function lineUnitPrice(item: PricedItem, quantity: number): number {
  return qualifiesForWholesale(item, quantity) && item.wholesalePrice !== null
    ? item.wholesalePrice
    : item.unitPrice;
}

export function couponDiscount(coupon: AppliedCoupon, subtotal: number): number {
  if (subtotal < coupon.minOrder) return 0;
  const discount =
    coupon.type === "PERCENT"
      ? Math.round((subtotal * Math.min(100, Math.max(0, coupon.value))) / 100)
      : coupon.value;
  return Math.min(subtotal, Math.max(0, discount));
}

/**
 * Cheapest nationwide method for the parcel weight, or 0 above the
 * free-shipping threshold. Null when no method is configured.
 */
export function estimateShipping(
  weightGrams: number,
  amount: number,
  config: ShippingConfig,
): number | null {
  if (config.freeShippingThreshold !== null && amount >= config.freeShippingThreshold) {
    return 0;
  }
  const costs = config.methods.map((method) => {
    const extraKg = Math.ceil(Math.max(0, weightGrams - method.baseWeightGrams) / 1000);
    return method.baseCost + extraKg * method.perExtraKg;
  });
  return costs.length > 0 ? Math.min(...costs) : null;
}

export type CartTotals = {
  itemCount: number;
  weightGrams: number;
  /** Sum at retail prices, before wholesale pricing. */
  retailSubtotal: number;
  /** Sum at the prices actually charged (wholesale where it applies). */
  subtotal: number;
  wholesaleSavings: number;
  discount: number;
  couponApplies: boolean;
  /** How much more to buy before the coupon applies (0 when it does). */
  couponShortfall: number;
  /** Null when shipping cannot be estimated. */
  shipping: number | null;
  /** How much more to buy for free shipping; null when not applicable. */
  freeShippingShortfall: number | null;
  total: number;
};

export function computeCartTotals(
  items: readonly CartItem[],
  coupon: AppliedCoupon | null,
  shipping: ShippingConfig | null = null,
): CartTotals {
  let itemCount = 0;
  let weightGrams = 0;
  let retailSubtotal = 0;
  let subtotal = 0;

  for (const item of items) {
    itemCount += item.quantity;
    weightGrams += item.weightGrams * item.quantity;
    retailSubtotal += item.unitPrice * item.quantity;
    subtotal += lineUnitPrice(item, item.quantity) * item.quantity;
  }

  const discount = coupon ? couponDiscount(coupon, subtotal) : 0;
  const afterDiscount = subtotal - discount;
  const shippingCost =
    shipping && items.length > 0 ? estimateShipping(weightGrams, afterDiscount, shipping) : null;
  const threshold = shipping?.freeShippingThreshold ?? null;

  return {
    itemCount,
    weightGrams,
    retailSubtotal,
    subtotal,
    wholesaleSavings: retailSubtotal - subtotal,
    discount,
    couponApplies: coupon !== null && discount > 0,
    couponShortfall: coupon ? Math.max(0, coupon.minOrder - subtotal) : 0,
    shipping: shippingCost,
    freeShippingShortfall:
      threshold !== null && afterDiscount < threshold ? threshold - afterDiscount : null,
    total: afterDiscount + (shippingCost ?? 0),
  };
}
