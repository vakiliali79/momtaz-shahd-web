import { z } from "zod";

import { routing } from "@/i18n/routing";
import { shippingMethodIds } from "@/lib/shipping";
import { couponCodeSchema } from "@/lib/validation/coupon";

export const paymentMethods = ["ONLINE", "COD", "BANK_TRANSFER"] as const;
export type PaymentMethodId = (typeof paymentMethods)[number];

export const ORDER_NOTE_MAX = 500;

export const placeOrderSchema = z.object({
  addressId: z.string().min(1, "addressRequired").max(64),
  shippingMethod: z.enum(shippingMethodIds, { error: "shippingRequired" }),
  paymentMethod: z.enum(paymentMethods, { error: "paymentRequired" }),
  note: z.string().trim().max(ORDER_NOTE_MAX, "noteTooLong"),
  couponCode: couponCodeSchema.nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(100_000),
      }),
    )
    .min(1, "emptyCart")
    .max(100),
  /** Total the customer saw; the order is refused if the server's differs. */
  expectedTotal: z.number().int().min(0),
  locale: z.enum(routing.locales),
});
export type PlaceOrderInput = z.input<typeof placeOrderSchema>;

/** Translation keys under `checkout.errors`. */
export const placeOrderErrorKeys = [
  "unauthorized",
  "invalid",
  "emptyCart",
  "addressRequired",
  "shippingRequired",
  "paymentRequired",
  "noteTooLong",
  "productUnavailable",
  "outOfStock",
  "couponInvalid",
  "shippingUnavailable",
  "paymentUnavailable",
  "totalChanged",
  "server",
] as const;
export type PlaceOrderErrorKey = (typeof placeOrderErrorKeys)[number];

export function toPlaceOrderErrorKey(message: string | undefined): PlaceOrderErrorKey {
  return placeOrderErrorKeys.find((key) => key === message) ?? "invalid";
}
