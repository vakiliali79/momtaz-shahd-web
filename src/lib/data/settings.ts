import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import type { LocalizedText } from "@/lib/localized";
import { shippingMethodIds, type ShippingConfig } from "@/lib/shipping";

const rateSchema = z.object({
  baseCost: z.number().int().min(0),
  perExtraKg: z.number().int().min(0),
});

const localizedSchema = z.object({ fa: z.string(), en: z.string(), ar: z.string() });

const shippingSchema = z.object({
  origin: z.object({ province: z.string(), city: z.string() }),
  pickupAddress: localizedSchema.nullable().default(null),
  methods: z.array(
    z.object({
      id: z.enum(shippingMethodIds),
      isActive: z.boolean().default(true),
      baseWeightGrams: z.number().int().min(0).default(1000),
      inProvince: rateSchema,
      outOfProvince: rateSchema.nullable().default(null),
      sameCityOnly: z.boolean().default(false),
      estimatedDays: z.object({ min: z.number().int().min(0), max: z.number().int().min(0) }),
    }),
  ),
});

const freeShippingSchema = z.object({
  enabled: z.boolean(),
  threshold: z.number().int().min(0),
});

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
