import type { LocalizedText } from "@/lib/localized";

/**
 * Shipping rules shared by the cart estimate, the checkout and placeOrder.
 * Rates come from the admin-editable `shipping` setting.
 */

export const shippingMethodIds = ["post", "tipax", "courier", "pickup"] as const;
export type ShippingMethodId = (typeof shippingMethodIds)[number];

export type ShippingRate = { baseCost: number; perExtraKg: number };

export type ShippingMethodConfig = {
  id: ShippingMethodId;
  isActive: boolean;
  /** Weight included in the base cost; each extra (started) kg costs `perExtraKg`. */
  baseWeightGrams: number;
  /** Rate when the destination is in the same province as the factory. */
  inProvince: ShippingRate;
  /** Rate for other provinces; null when the method does not go there. */
  outOfProvince: ShippingRate | null;
  /** Courier: only delivers inside the factory's city. */
  sameCityOnly: boolean;
  estimatedDays: { min: number; max: number };
};

export type ShippingConfig = {
  /** Where orders ship from (province and city ids). */
  origin: { province: string; city: string };
  /** Factory address shown for the pickup option. */
  pickupAddress: LocalizedText | null;
  methods: ShippingMethodConfig[];
  /** Orders at or above this amount ship free (except pickup, which is free anyway). */
  freeShippingThreshold: number | null;
};

export type Destination = { province: string; city: string };

export type ShippingAvailability =
  | { available: true }
  | { available: false; reason: "inactive" | "sameCityOnly" | "noRate" };

export function shippingAvailability(
  config: ShippingConfig,
  methodId: ShippingMethodId,
  destination: Destination | null,
): ShippingAvailability {
  const method = config.methods.find((entry) => entry.id === methodId);
  if (!method || !method.isActive) return { available: false, reason: "inactive" };
  if (method.id === "pickup") return { available: true };
  const sameProvince = destination?.province === config.origin.province;
  if (method.sameCityOnly) {
    return sameProvince && destination?.city === config.origin.city
      ? { available: true }
      : { available: false, reason: "sameCityOnly" };
  }
  return sameProvince || method.outOfProvince
    ? { available: true }
    : { available: false, reason: "noRate" };
}

/**
 * Cost of sending `weightGrams` with `methodId` to `destination`, before any
 * free-shipping threshold. Null when the method is unavailable there.
 * A null destination is priced as another province (the cautious estimate).
 */
export function calculateShipping(
  config: ShippingConfig,
  methodId: ShippingMethodId,
  weightGrams: number,
  destination: Destination | null,
): number | null {
  if (destination && !shippingAvailability(config, methodId, destination).available) return null;
  const method = config.methods.find((entry) => entry.id === methodId && entry.isActive);
  if (!method) return null;
  if (method.id === "pickup") return 0;
  if (!destination && method.sameCityOnly) return null;

  const sameProvince = destination?.province === config.origin.province;
  const rate = sameProvince ? method.inProvince : method.outOfProvince;
  if (!rate) return null;
  const extraKg = Math.ceil(Math.max(0, weightGrams - method.baseWeightGrams) / 1000);
  return rate.baseCost + extraKg * rate.perExtraKg;
}

/** Cheapest delivery (not pickup) option, for the cart page estimate. */
export function estimateShipping(
  config: ShippingConfig,
  weightGrams: number,
  destination: Destination | null,
): number | null {
  const costs = config.methods
    .filter((method) => method.id !== "pickup" && !method.sameCityOnly)
    .map((method) => calculateShipping(config, method.id, weightGrams, destination))
    .filter((cost): cost is number => cost !== null);
  return costs.length > 0 ? Math.min(...costs) : null;
}

/** Applies the free-shipping threshold to a calculated cost. */
export function applyFreeShipping(
  config: ShippingConfig,
  cost: number | null,
  amount: number,
): number | null {
  if (cost === null) return null;
  return config.freeShippingThreshold !== null && amount >= config.freeShippingThreshold
    ? 0
    : cost;
}
