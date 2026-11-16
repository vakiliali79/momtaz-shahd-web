import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import type { ShippingConfig } from "@/lib/cart";
import { db } from "@/lib/db";

const shippingSchema = z.object({
  methods: z.array(
    z.object({
      id: z.string(),
      baseCost: z.number().int().min(0),
      baseWeightGrams: z.number().int().min(0),
      perExtraKg: z.number().int().min(0),
      isActive: z.boolean().default(true),
      onlyCities: z.array(z.string()).optional(),
    }),
  ),
});

const freeShippingSchema = z.object({
  enabled: z.boolean(),
  threshold: z.number().int().min(0),
});

/**
 * Shipping rates for cart estimates, from the admin-editable `shipping` and
 * `freeShipping` settings. City-only methods (e.g. a Tehran courier) are left
 * out because the destination is not known yet. Invalid settings are treated
 * as "not configured" rather than crashing the cart.
 */
export async function getShippingConfig(): Promise<ShippingConfig> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  const rows = await db.setting.findMany({
    where: { key: { in: ["shipping", "freeShipping"] } },
  });
  const value = (key: string) => rows.find((row) => row.key === key)?.value;

  const shipping = shippingSchema.safeParse(value("shipping"));
  const freeShipping = freeShippingSchema.safeParse(value("freeShipping"));

  return {
    methods: shipping.success
      ? shipping.data.methods
          .filter((method) => method.isActive && !method.onlyCities?.length)
          .map(({ id, baseCost, baseWeightGrams, perExtraKg }) => ({
            id,
            baseCost,
            baseWeightGrams,
            perExtraKg,
          }))
      : [],
    freeShippingThreshold:
      freeShipping.success && freeShipping.data.enabled ? freeShipping.data.threshold : null,
  };
}
