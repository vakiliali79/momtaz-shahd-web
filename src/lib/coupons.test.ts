import { describe, expect, test } from "vitest";

import { couponDiscount } from "./cart";
import { couponIssue, type CouponRecord } from "./coupons";
import { couponCodeSchema, couponRequestSchema } from "./validation/coupon";

const now = new Date("2026-06-01T12:00:00Z");
const base: CouponRecord = { isActive: true, expiresAt: null, maxUses: null, usedCount: 0, minOrder: 300_000 };

describe("couponIssue", () => {
  test("a valid coupon above the minimum has no issue", () => {
    expect(couponIssue(base, 300_000, now)).toBeNull();
  });

  test("missing or deactivated coupons are not found", () => {
    expect(couponIssue(null, 500_000, now)).toBe("notFound");
    expect(couponIssue({ ...base, isActive: false }, 500_000, now)).toBe("notFound");
  });

  test("expires at the exact expiry instant", () => {
    expect(couponIssue({ ...base, expiresAt: new Date("2026-06-01T12:00:00Z") }, 500_000, now)).toBe("expired");
    expect(couponIssue({ ...base, expiresAt: new Date("2026-06-01T12:00:01Z") }, 500_000, now)).toBeNull();
  });

  test("used up once usedCount reaches maxUses", () => {
    expect(couponIssue({ ...base, maxUses: 5, usedCount: 4 }, 500_000, now)).toBeNull();
    expect(couponIssue({ ...base, maxUses: 5, usedCount: 5 }, 500_000, now)).toBe("usedUp");
  });

  test("below the minimum order", () => {
    expect(couponIssue(base, 299_999, now)).toBe("minOrder");
  });

  test("checks in order: inactive before expired before used up before minimum", () => {
    const everythingWrong = { isActive: false, expiresAt: new Date(0), maxUses: 1, usedCount: 1, minOrder: 1_000_000 };
    expect(couponIssue(everythingWrong, 0, now)).toBe("notFound");
    expect(couponIssue({ ...everythingWrong, isActive: true }, 0, now)).toBe("expired");
    expect(couponIssue({ ...everythingWrong, isActive: true, expiresAt: null }, 0, now)).toBe("usedUp");
  });
});

describe("coupon code validation (Zod)", () => {
  test("normalises case and whitespace", () => {
    expect(couponCodeSchema.parse("  welcome10 ")).toBe("WELCOME10");
  });

  test("rejects empty, too long and unsafe codes with translation keys", () => {
    expect(couponCodeSchema.safeParse("").error?.issues[0]?.message).toBe("required");
    expect(couponCodeSchema.safeParse("A".repeat(33)).error?.issues[0]?.message).toBe("invalid");
    expect(couponCodeSchema.safeParse("DROP TABLE;").error?.issues[0]?.message).toBe("invalid");
  });

  test("the request needs a whole, non-negative subtotal", () => {
    expect(couponRequestSchema.safeParse({ code: "X1", subtotal: -1 }).success).toBe(false);
    expect(couponRequestSchema.safeParse({ code: "X1", subtotal: 10.5 }).success).toBe(false);
    expect(couponRequestSchema.safeParse({ code: "X1", subtotal: 10 }).success).toBe(true);
  });
});

describe("couponDiscount", () => {
  test("percent coupons round to whole Toman", () => {
    expect(couponDiscount({ code: "P", type: "PERCENT", value: 10, minOrder: 0 }, 123_455)).toBe(12_346);
  });

  test("fixed coupons never exceed the subtotal", () => {
    expect(couponDiscount({ code: "F", type: "FIXED", value: 50_000, minOrder: 0 }, 30_000)).toBe(30_000);
  });

  test("nothing below the minimum, and percent is clamped to 0–100", () => {
    expect(couponDiscount({ code: "F", type: "FIXED", value: 50_000, minOrder: 100_000 }, 99_999)).toBe(0);
    expect(couponDiscount({ code: "P", type: "PERCENT", value: 150, minOrder: 0 }, 80_000)).toBe(80_000);
  });
});
