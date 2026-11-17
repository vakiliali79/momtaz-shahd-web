/**
 * The rules a discount code must pass, shared by the cart's coupon check and
 * by placeOrder (which also counts the use atomically). Pure and testable.
 */
export type CouponRecord = {
  isActive: boolean;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  minOrder: number;
};

export type CouponIssue = "notFound" | "expired" | "usedUp" | "minOrder";

/** Why the coupon can't be used for this subtotal right now, or null if it can. */
export function couponIssue(coupon: CouponRecord | null, subtotal: number, now: Date = new Date()): CouponIssue | null {
  if (!coupon || !coupon.isActive) return "notFound";
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) return "expired";
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return "usedUp";
  if (subtotal < coupon.minOrder) return "minOrder";
  return null;
}
