import { z } from "zod";

/** Error messages are translation keys under `cart.coupon.errors`. */
export const couponCodeSchema = z
  .string()
  .trim()
  .min(1, "required")
  .max(32, "invalid")
  .toUpperCase()
  .regex(/^[A-Z0-9_-]+$/, "invalid");

export const couponFormSchema = z.object({ code: couponCodeSchema });
export type CouponFormInput = z.input<typeof couponFormSchema>;

export const couponRequestSchema = z.object({
  code: couponCodeSchema,
  subtotal: z.number().int().min(0).max(1e13),
});

export const couponErrorKeys = [
  "required",
  "invalid",
  "notFound",
  "expired",
  "usedUp",
  "minOrder",
  "server",
] as const;
export type CouponErrorKey = (typeof couponErrorKeys)[number];

export function toCouponErrorKey(message: string | undefined): CouponErrorKey {
  return couponErrorKeys.find((key) => key === message) ?? "invalid";
}
