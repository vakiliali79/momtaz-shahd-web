import { z } from "zod";

import { shippingMethodIds } from "@/lib/shipping";

/**
 * Shapes of the admin-editable `Setting` rows. Shared by the storefront
 * (which reads them leniently) and the admin forms (which validate them).
 * Error messages are keys under `admin.errors`.
 */

const text = (max: number) => z.string().trim().max(max, "tooLong");
const localized = (max: number) => z.object({ fa: text(max), en: text(max), ar: text(max) });
const toman = z.number({ error: "required" }).int("mustBeWhole").min(0, "mustBePositive").max(1_000_000_000, "tooLong");

export const shippingRateSchema = z.object({ baseCost: toman, perExtraKg: toman });

export const shippingMethodSchema = z.object({
  id: z.enum(shippingMethodIds),
  isActive: z.boolean().default(true),
  baseWeightGrams: z.number({ error: "required" }).int("mustBeWhole").min(0, "mustBePositive").max(1_000_000, "tooLong").default(1000),
  inProvince: shippingRateSchema,
  outOfProvince: shippingRateSchema.nullable().default(null),
  /** Per-province prices that replace the in/out-of-province rate. */
  provinceRates: z.record(z.string(), shippingRateSchema).default({}),
  sameCityOnly: z.boolean().default(false),
  estimatedDays: z.object({
    min: z.number({ error: "required" }).int("mustBeWhole").min(0, "mustBePositive").max(60, "tooLong"),
    max: z.number({ error: "required" }).int("mustBeWhole").min(0, "mustBePositive").max(60, "tooLong"),
  }),
});

export const shippingSettingSchema = z.object({
  schemaVersion: z.literal(2).default(2),
  origin: z.object({ province: z.string().min(1, "required"), city: z.string().min(1, "required") }),
  pickupAddress: localized(300).nullable().default(null),
  methods: z.array(shippingMethodSchema),
});
export type ShippingSetting = z.output<typeof shippingSettingSchema>;

export const freeShippingSettingSchema = z.object({ enabled: z.boolean(), threshold: toman });

export const currencyCodes = ["USD", "AED"] as const;
export type CurrencyCode = (typeof currencyCodes)[number];

export const exchangeRatesSettingSchema = z.object({
  base: z.literal("IRT").default("IRT"),
  /** Toman per one unit of the currency; 0 hides that currency. */
  rates: z.object({ USD: toman, AED: toman }),
  /** Show "≈ $12" next to Toman prices for English and Arabic visitors. */
  showApproximate: z.boolean(),
  updatedAt: z.string().nullable().default(null),
});
export type ExchangeRatesSetting = z.output<typeof exchangeRatesSettingSchema>;

const optionalUrl = z
  .string()
  .trim()
  .max(300, "tooLong")
  .refine((value) => value === "" || /^https:\/\/[^\s]+$/.test(value), "invalidUrl");

export const contactSettingSchema = z.object({
  phone: text(30),
  whatsapp: text(20).refine((value) => value === "" || /^\+?\d{8,15}$/.test(value), "invalid"),
  email: z.union([z.literal(""), z.email("invalid").max(120, "tooLong")]),
  /** Instagram handle without "@". */
  instagram: text(30).refine((value) => value === "" || /^[A-Za-z0-9._]{1,30}$/.test(value), "invalid"),
  address: localized(300),
  workingHours: localized(200),
  social: z
    .object({ telegram: optionalUrl, aparat: optionalUrl, linkedin: optionalUrl, eitaa: optionalUrl })
    .default({ telegram: "", aparat: "", linkedin: "", eitaa: "" }),
});
export type ContactSetting = z.output<typeof contactSettingSchema>;
export const socialKeys = ["telegram", "aparat", "linkedin", "eitaa"] as const;

export const announcementSettingSchema = z.object({
  enabled: z.boolean(),
  text: localized(200),
  /** A path on this site, e.g. "/products" (optional). */
  link: z
    .string()
    .trim()
    .max(200, "tooLong")
    .refine((value) => value === "" || /^\/[A-Za-z0-9\-_/?=&.]*$/.test(value), "invalidUrl"),
});
export type AnnouncementSetting = z.output<typeof announcementSettingSchema>;

export const bankTransferSettingSchema = z.object({
  bankName: localized(80),
  accountHolder: localized(120),
  sheba: z.string().trim().toUpperCase().regex(/^IR\d{24}$/, "invalid"),
  cardNumber: z.string().trim().regex(/^\d{4}-?\d{4}-?\d{4}-?\d{4}$/, "invalid"),
});

export const settingSchemas = {
  shipping: shippingSettingSchema,
  freeShipping: freeShippingSettingSchema,
  exchangeRates: exchangeRatesSettingSchema,
  contact: contactSettingSchema,
  announcementBanner: announcementSettingSchema,
  bankTransfer: bankTransferSettingSchema,
} as const;
export type SettingKey = keyof typeof settingSchemas;
