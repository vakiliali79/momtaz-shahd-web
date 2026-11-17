/**
 * placeOrder against a real (SQLite) test database built from the migrations.
 * Only framework edges are mocked: the session, Next's cache tags and after().
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import type { CurrentUser } from "@/lib/session";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));
const effects = vi.hoisted(() => ({ tags: [] as string[], after: [] as (() => unknown)[] }));

vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));
vi.mock("next/cache", () => ({
  cacheLife: () => undefined,
  cacheTag: () => undefined,
  updateTag: (tag: string) => void effects.tags.push(tag),
  revalidateTag: (tag: string) => void effects.tags.push(tag),
}));
vi.mock("next/server", () => ({ after: (task: () => unknown) => void effects.after.push(task) }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key }));

const { placeOrder } = await import("@/actions/checkout");
const { checkCoupon } = await import("@/actions/cart");
const { db } = await import("@/lib/db");

let customer: CurrentUser;
let other: CurrentUser;
let addressId: string;
let otherAddressId: string;
let walnutId: string;
let dateId: string;
let retiredId: string;

const shipping = {
  schemaVersion: 2,
  origin: { province: "tehran", city: "tehran" },
  pickupAddress: null,
  methods: [
    {
      id: "post", isActive: true, baseWeightGrams: 1000, sameCityOnly: false, provinceRates: {},
      inProvince: { baseCost: 50_000, perExtraKg: 10_000 }, outOfProvince: { baseCost: 70_000, perExtraKg: 15_000 },
      estimatedDays: { min: 2, max: 5 },
    },
  ],
};

beforeAll(async () => {
  const category = await db.category.create({ data: { slug: "koloocheh", name: { fa: "کلوچه", en: "Koloocheh", ar: "كلوجة" } } });
  const make = (slug: string, price: number, weightGrams: number, extra: object = {}) =>
    db.product.create({
      data: { slug, name: { fa: slug, en: slug, ar: slug }, description: { fa: "", en: "", ar: "" }, categoryId: category.id, price, weightGrams, stock: 10, isActive: true, ...extra },
      select: { id: true },
    });
  walnutId = (await make("walnut", 100_000, 450)).id;
  dateId = (await make("date", 150_000, 500)).id;
  retiredId = (await make("retired", 90_000, 400, { isActive: false })).id;

  const user = await db.user.create({ data: { phone: "09120000101", name: "Test Customer" } });
  const stranger = await db.user.create({ data: { phone: "09120000102", name: "Someone Else" } });
  customer = { id: user.id, name: user.name, phone: user.phone, email: null, role: "CUSTOMER" };
  other = { id: stranger.id, name: stranger.name, phone: stranger.phone, email: null, role: "CUSTOMER" };
  const address = (userId: string) =>
    db.address.create({
      data: { userId, title: "Home", province: "tehran", city: "tehran", fullAddress: "Valiasr St.", postalCode: "1234567890", receiverName: "Test", receiverPhone: "09120000101" },
      select: { id: true },
    });
  addressId = (await address(user.id)).id;
  otherAddressId = (await address(stranger.id)).id;

  await db.setting.createMany({
    data: [
      { key: "shipping", value: shipping },
      { key: "freeShipping", value: { enabled: true, threshold: 1_000_000 } },
    ],
  });
  await db.coupon.createMany({
    data: [
      { code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 300_000 },
      { code: "ONCE", type: "FIXED", value: 20_000, minOrder: 0, maxUses: 1 },
      { code: "OLD", type: "PERCENT", value: 15, minOrder: 0, expiresAt: new Date("2025-12-31T23:59:59Z") },
    ],
  });
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(() => {
  session.user = customer;
  effects.tags.length = 0;
  effects.after.length = 0;
});

/** 2 × walnut (100,000) + 1 × date (150,000) = 350,000; 1,400 g → post 60,000 in Tehran. */
const order = (overrides: Record<string, unknown> = {}) => ({
  addressId,
  shippingMethod: "post",
  paymentMethod: "COD",
  note: "",
  couponCode: null,
  items: [
    { productId: walnutId, quantity: 2 },
    { productId: dateId, quantity: 1 },
  ],
  expectedTotal: 410_000,
  locale: "en",
  ...overrides,
});

const stockOf = async (id: string) => (await db.product.findUniqueOrThrow({ where: { id } })).stock;

describe("placeOrder", () => {
  test("requires a signed-in customer", async () => {
    session.user = null;
    expect(await placeOrder(order())).toEqual({ ok: false, error: "unauthorized" });
  });

  test("validates input with Zod (translation keys as errors)", async () => {
    expect(await placeOrder(order({ items: [] }))).toEqual({ ok: false, error: "emptyCart" });
    expect(await placeOrder(order({ shippingMethod: "teleport" }))).toEqual({ ok: false, error: "shippingRequired" });
    expect(await placeOrder("not an object")).toMatchObject({ ok: false });
  });

  test("cash on delivery: creates the order from database prices, takes stock and counts the coupon", async () => {
    // 350,000 − 10% (35,000) + 60,000 shipping = 375,000
    const result = await placeOrder(order({ couponCode: "welcome10", expectedTotal: 375_000 }));
    expect(result).toMatchObject({ ok: true, nextUrl: expect.stringContaining("/en/checkout/success/") });
    if (!result.ok) return;

    const saved = await db.order.findUniqueOrThrow({
      where: { orderNumber: result.orderNumber },
      include: { items: true, statusHistory: true },
    });
    expect(saved).toMatchObject({ userId: customer.id, status: "PROCESSING", paymentMethod: "COD", type: "RETAIL", couponCode: "WELCOME10" });
    expect(Number(saved.subtotal)).toBe(350_000);
    expect(Number(saved.discount)).toBe(35_000);
    expect(Number(saved.shippingCost)).toBe(60_000);
    expect(Number(saved.total)).toBe(375_000);
    expect(saved.items.map((item) => [item.unitPrice, item.quantity]).sort()).toEqual([[100_000, 2], [150_000, 1]]);
    expect(saved.statusHistory).toEqual([expect.objectContaining({ status: "PROCESSING", note: "order_placed_cod" })]);

    expect(await stockOf(walnutId)).toBe(8);
    expect(await stockOf(dateId)).toBe(9);
    expect((await db.coupon.findUniqueOrThrow({ where: { code: "WELCOME10" } })).usedCount).toBe(1);
    expect(effects.tags).toContain("catalog");
    expect(effects.after).toHaveLength(1); // customer SMS + team alert, after the response
  });

  test("refuses when the total the customer saw is out of date, and changes nothing", async () => {
    const before = await stockOf(walnutId);
    expect(await placeOrder(order({ expectedTotal: 1 }))).toEqual({ ok: false, error: "totalChanged" });
    expect(await stockOf(walnutId)).toBe(before);
  });

  test("refuses more than the stock and says how many are left", async () => {
    const left = await stockOf(dateId);
    const result = await placeOrder(order({ items: [{ productId: dateId, quantity: left + 1 }] }));
    expect(result).toMatchObject({ ok: false, error: "outOfStock", available: left });
  });

  test("refuses inactive products", async () => {
    expect(await placeOrder(order({ items: [{ productId: retiredId, quantity: 1 }] }))).toMatchObject({ ok: false, error: "productUnavailable" });
  });

  test("cannot ship to another customer's address (IDOR)", async () => {
    expect(await placeOrder(order({ addressId: otherAddressId }))).toEqual({ ok: false, error: "addressRequired" });
    session.user = other;
    expect(await placeOrder(order({ addressId }))).toEqual({ ok: false, error: "addressRequired" });
  });

  test("a single-use coupon works once, then reports used up", async () => {
    // 350,000 − 20,000 + 60,000
    expect(await placeOrder(order({ couponCode: "ONCE", expectedTotal: 390_000 }))).toMatchObject({ ok: true });
    expect(await placeOrder(order({ couponCode: "ONCE", expectedTotal: 390_000 }))).toEqual({ ok: false, error: "couponInvalid", detail: "usedUp" });
    expect(await placeOrder(order({ couponCode: "OLD", expectedTotal: 357_500 }))).toEqual({ ok: false, error: "couponInvalid", detail: "expired" });
  });

  test("bank transfer is only offered for wholesale orders", async () => {
    expect(await placeOrder(order({ paymentMethod: "BANK_TRANSFER" }))).toEqual({ ok: false, error: "paymentUnavailable" });
  });
});

describe("checkCoupon", () => {
  test("accepts a valid code (case-insensitive) and reports the rules", async () => {
    expect(await checkCoupon({ code: "welcome10", subtotal: 400_000 })).toEqual({
      ok: true,
      coupon: { code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 300_000 },
    });
  });

  test("explains why a code can't be used", async () => {
    expect(await checkCoupon({ code: "WELCOME10", subtotal: 100_000 })).toEqual({ ok: false, error: "minOrder", minOrder: 300_000 });
    expect(await checkCoupon({ code: "OLD", subtotal: 100_000 })).toEqual({ ok: false, error: "expired" });
    expect(await checkCoupon({ code: "NOPE", subtotal: 100_000 })).toEqual({ ok: false, error: "notFound" });
    expect(await checkCoupon({ code: "", subtotal: 100_000 })).toEqual({ ok: false, error: "required" });
  });
});
