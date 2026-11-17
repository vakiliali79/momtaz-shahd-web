/** Shipping price rules (rates, weight steps, province overrides, free shipping). Run with `pnpm test`. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { applyFreeShipping, calculateShipping, shippingAvailability, type ShippingConfig } from "./shipping";

const config: ShippingConfig = {
  origin: { province: "tehran", city: "tehran" },
  pickupAddress: null,
  freeShippingThreshold: 1_000_000,
  methods: [
    {
      id: "post",
      isActive: true,
      baseWeightGrams: 1000,
      inProvince: { baseCost: 50_000, perExtraKg: 10_000 },
      outOfProvince: null,
      provinceRates: { fars: { baseCost: 90_000, perExtraKg: 20_000 } },
      sameCityOnly: false,
      estimatedDays: { min: 1, max: 3 },
    },
    {
      id: "courier",
      isActive: true,
      baseWeightGrams: 5000,
      inProvince: { baseCost: 80_000, perExtraKg: 0 },
      outOfProvince: null,
      provinceRates: {},
      sameCityOnly: true,
      estimatedDays: { min: 0, max: 1 },
    },
  ],
};

test("same province uses the in-province rate and charges each started extra kg", () => {
  assert.equal(calculateShipping(config, "post", 1000, { province: "tehran", city: "tehran" }), 50_000);
  assert.equal(calculateShipping(config, "post", 2100, { province: "tehran", city: "shahriar" }), 70_000);
});

test("a province override applies even when other provinces are not served", () => {
  assert.equal(calculateShipping(config, "post", 1500, { province: "fars", city: "shiraz" }), 110_000);
  assert.deepEqual(shippingAvailability(config, "post", { province: "fars", city: "shiraz" }), { available: true });
  assert.equal(calculateShipping(config, "post", 1000, { province: "kerman", city: "kerman" }), null);
  assert.deepEqual(shippingAvailability(config, "post", { province: "kerman", city: "kerman" }), { available: false, reason: "noRate" });
});

test("city-only couriers refuse other cities", () => {
  assert.equal(calculateShipping(config, "courier", 1000, { province: "tehran", city: "tehran" }), 80_000);
  assert.equal(calculateShipping(config, "courier", 1000, { province: "tehran", city: "shahriar" }), null);
});

test("orders at the threshold ship free", () => {
  assert.equal(applyFreeShipping(config, 50_000, 999_999), 50_000);
  assert.equal(applyFreeShipping(config, 50_000, 1_000_000), 0);
  assert.equal(applyFreeShipping(config, null, 2_000_000), null);
});
