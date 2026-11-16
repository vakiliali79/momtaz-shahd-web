import { z } from "zod";

import { getCity, getProvince } from "@/lib/locations";
import { iranMobileSchema, toLatinDigits } from "@/lib/validation/phone";

/** Error messages are translation keys under `address.errors`. */
export const addressSchema = z
  .object({
    title: z.string().trim().min(1, "titleRequired").max(40, "tooLong"),
    province: z.string().min(1, "provinceRequired"),
    city: z.string().min(1, "cityRequired"),
    fullAddress: z.string().trim().min(10, "addressTooShort").max(300, "tooLong"),
    postalCode: z
      .string()
      .transform((value) => toLatinDigits(value).replace(/[\s-]/g, ""))
      .pipe(z.string().regex(/^\d{10}$/, "invalidPostalCode")),
    receiverName: z.string().trim().min(2, "nameRequired").max(80, "tooLong"),
    receiverPhone: iranMobileSchema,
    // Roughly Iran's bounding box; the pin is optional.
    lat: z.number().min(24).max(40.5).nullable(),
    lng: z.number().min(43).max(64).nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.province && !getProvince(data.province)) {
      ctx.addIssue({ code: "custom", path: ["province"], message: "provinceRequired" });
    } else if (data.city && !getCity(data.province, data.city)) {
      ctx.addIssue({ code: "custom", path: ["city"], message: "cityRequired" });
    }
    if ((data.lat === null) !== (data.lng === null)) {
      ctx.addIssue({ code: "custom", path: ["lat"], message: "invalidLocation" });
    }
  });

export type AddressInput = z.input<typeof addressSchema>;
export type AddressOutput = z.output<typeof addressSchema>;

export const addressErrorKeys = [
  "titleRequired",
  "provinceRequired",
  "cityRequired",
  "addressTooShort",
  "invalidPostalCode",
  "nameRequired",
  "invalidPhone",
  "invalidLocation",
  "tooLong",
  "limitReached",
  "unauthorized",
  "server",
] as const;
export type AddressErrorKey = (typeof addressErrorKeys)[number];

export function toAddressErrorKey(message: string | undefined): AddressErrorKey {
  return addressErrorKeys.find((key) => key === message) ?? "server";
}
