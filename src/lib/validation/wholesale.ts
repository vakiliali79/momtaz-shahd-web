import { z } from "zod";

import { routing } from "@/i18n/routing";
import { getCity, getProvince } from "@/lib/locations";
import { IRAN_MOBILE_REGEX, normalizeIranMobile, toLatinDigits } from "@/lib/validation/phone";

/**
 * The public wholesale request and "become a dealer" forms (same fields,
 * same inbox). Shared by the client form and the server action; error
 * messages are keys under `wholesaleForm.errors`.
 */
export const wholesaleRequestTypes = ["WHOLESALE", "AGENCY"] as const;

export const wholesaleRequestSchema = z
  .object({
    type: z.enum(wholesaleRequestTypes),
    companyName: z.string().trim().min(2, "companyRequired").max(120, "tooLong"),
    contactName: z.string().trim().min(2, "nameRequired").max(80, "tooLong"),
    phone: z
      .string()
      .trim()
      .transform((value) => normalizeIranMobile(value))
      .pipe(z.string().regex(IRAN_MOBILE_REGEX, "invalidPhone")),
    email: z
      .string()
      .trim()
      .max(254, "tooLong")
      .pipe(z.union([z.literal(""), z.email("invalidEmail")], { error: "invalidEmail" })),
    province: z.string().min(1, "provinceRequired"),
    city: z.string().min(1, "cityRequired"),
    products: z.string().trim().min(2, "productsRequired").max(1000, "tooLong"),
    estimatedQty: z.string().trim().max(100, "tooLong").transform((value) => toLatinDigits(value)),
    message: z.string().trim().max(3000, "tooLong"),
    locale: z.enum(routing.locales),
    /** Honeypot: real visitors never see or fill this field. */
    website: z.string().max(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (!getProvince(data.province)) ctx.addIssue({ code: "custom", path: ["province"], message: "provinceRequired" });
    else if (!getCity(data.province, data.city)) ctx.addIssue({ code: "custom", path: ["city"], message: "cityRequired" });
  });

export type WholesaleRequestInput = z.input<typeof wholesaleRequestSchema>;

export const wholesaleErrorKeys = [
  "companyRequired",
  "nameRequired",
  "invalidPhone",
  "invalidEmail",
  "provinceRequired",
  "cityRequired",
  "productsRequired",
  "tooLong",
  "tooMany",
  "server",
] as const;
export type WholesaleErrorKey = (typeof wholesaleErrorKeys)[number];

export function toWholesaleErrorKey(message: string | undefined): WholesaleErrorKey {
  return wholesaleErrorKeys.find((key) => key === message) ?? "server";
}
