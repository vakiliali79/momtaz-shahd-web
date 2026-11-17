import { z } from "zod";

import { imageUrlSchema, localizedOptional, localizedRequired } from "@/lib/admin/validation";
import { getCity, getProvince } from "@/lib/locations";
import { toLatinDigits } from "@/lib/validation/phone";

export const dealerTypes = ["DISTRIBUTOR", "RETAIL_STORE", "AGENCY"] as const;

const optionalText = (max: number, pattern: RegExp) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .transform((value) => toLatinDigits(value))
    .refine((value) => value === "" || pattern.test(value), "invalid");

export const dealerSchema = z
  .object({
    name: localizedRequired(120),
    address: localizedRequired(300),
    openingHours: localizedOptional(200),
    type: z.enum(dealerTypes),
    province: z.string().min(1, "required"),
    city: z.string().min(1, "required"),
    phone: optionalText(20, /^\+?[\d-]{6,20}$/),
    whatsapp: optionalText(20, /^\+?\d{8,15}$/),
    /** Instagram handle without "@". */
    instagram: optionalText(30, /^[A-Za-z0-9._]{1,30}$/),
    location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).nullable(),
    images: z.array(imageUrlSchema).max(1, "tooLong"),
    isActive: z.boolean(),
    isVerified: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!getProvince(value.province)) ctx.addIssue({ code: "custom", path: ["province"], message: "required" });
    else if (!getCity(value.province, value.city)) ctx.addIssue({ code: "custom", path: ["city"], message: "required" });
  });
export type DealerInput = z.input<typeof dealerSchema>;
export type DealerOutput = z.output<typeof dealerSchema>;
