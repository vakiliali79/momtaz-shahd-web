import { z } from "zod";

import { ORDER_NUMBER_PATTERN } from "@/lib/orders/order-number-pattern";
import { IRAN_MOBILE_REGEX, normalizeIranMobile, toLatinDigits } from "@/lib/validation/phone";

/** Order tracking without signing in. Errors are keys under `track.errors`. */
export const trackSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .transform((value) => toLatinDigits(value).toUpperCase().replace(/\s+/g, ""))
    .pipe(z.string().regex(ORDER_NUMBER_PATTERN, "invalidNumber")),
  phone: z
    .string()
    .trim()
    .transform((value) => normalizeIranMobile(value))
    .pipe(z.string().regex(IRAN_MOBILE_REGEX, "invalidPhone")),
});
export type TrackInput = z.input<typeof trackSchema>;

export const trackErrorKeys = ["invalidNumber", "invalidPhone", "notFound", "tooMany", "server"] as const;
export type TrackErrorKey = (typeof trackErrorKeys)[number];
export const toTrackErrorKey = (message: string | undefined): TrackErrorKey =>
  trackErrorKeys.find((key) => key === message) ?? "server";
