import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import type { LocalizedText } from "@/lib/localized";
import { siteConfig } from "@/config/site";
import type { ShippingConfig } from "@/lib/shipping";
import {
  announcementSettingSchema,
  contactSettingSchema,
  exchangeRatesSettingSchema,
  freeShippingSettingSchema as freeShippingSchema,
  shippingSettingSchema as shippingSchema,
  type AnnouncementSetting,
  type ContactSetting,
  type ExchangeRatesSetting,
} from "@/lib/settings-schemas";

const localizedSchema = z.object({ fa: z.string(), en: z.string(), ar: z.string() });

async function readSettings(keys: string[]): Promise<Map<string, unknown>> {
  const rows = await db.setting.findMany({ where: { key: { in: keys } } });
  return new Map(rows.map((row) => [row.key, row.value]));
}

/**
 * Shipping rates and rules from the admin-editable `shipping` and
 * `freeShipping` settings. Invalid settings are logged and treated as "no
 * methods configured" instead of crashing the shop.
 */
export async function getShippingConfig(): Promise<ShippingConfig> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  const values = await readSettings(["shipping", "freeShipping"]);
  const shipping = shippingSchema.safeParse(values.get("shipping"));
  const freeShipping = freeShippingSchema.safeParse(values.get("freeShipping"));
  if (!shipping.success) console.error("[settings] Invalid shipping setting:", shipping.error.issues);

  return {
    origin: shipping.success ? shipping.data.origin : { province: "", city: "" },
    pickupAddress: shipping.success ? shipping.data.pickupAddress : null,
    methods: shipping.success ? shipping.data.methods : [],
    freeShippingThreshold:
      freeShipping.success && freeShipping.data.enabled ? freeShipping.data.threshold : null,
  };
}

export type BankTransferInfo = {
  bankName: LocalizedText;
  accountHolder: LocalizedText;
  sheba: string;
  cardNumber: string;
};

const bankTransferSchema = z.object({
  bankName: localizedSchema,
  accountHolder: localizedSchema,
  sheba: z.string(),
  cardNumber: z.string(),
});

/** Account details shown to customers who pay by bank transfer. */
export async function getBankTransferInfo(): Promise<BankTransferInfo | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  const values = await readSettings(["bankTransfer"]);
  const parsed = bankTransferSchema.safeParse(values.get("bankTransfer"));
  return parsed.success ? parsed.data : null;
}

const emptyText = { fa: "", en: "", ar: "" };

/** Shop phone, email, address and social links (admin-editable `contact`). */
export async function getContactInfo(): Promise<ContactSetting> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  const values = await readSettings(["contact"]);
  const parsed = contactSettingSchema.safeParse(values.get("contact"));
  if (parsed.success) return parsed.data;
  return {
    phone: siteConfig.phone,
    whatsapp: "",
    email: siteConfig.email,
    instagram: "momtaz_shahd",
    address: emptyText,
    workingHours: emptyText,
    social: { telegram: "", aparat: "", linkedin: "", eitaa: "" },
  };
}

/** The strip above the header; null when switched off or empty. */
export async function getAnnouncement(): Promise<AnnouncementSetting | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  const values = await readSettings(["announcementBanner"]);
  const parsed = announcementSettingSchema.safeParse(values.get("announcementBanner"));
  return parsed.success && parsed.data.enabled ? parsed.data : null;
}

/** Admin-set rates for showing approximate USD/AED next to Toman prices. */
export async function getExchangeRates(): Promise<ExchangeRatesSetting | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  const values = await readSettings(["exchangeRates"]);
  const parsed = exchangeRatesSettingSchema.safeParse(values.get("exchangeRates"));
  return parsed.success ? parsed.data : null;
}
