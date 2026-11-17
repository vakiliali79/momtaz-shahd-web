import { describe, expect, test } from "vitest";

import { formatDate, formatNumber, formatPrice } from "./format";

// The unit is joined with a no-break space so "Toman" never wraps away from the amount.
const NBSP = "\u00a0";

describe("formatPrice", () => {
  test("Persian: Persian digits and the Persian thousands separator", () => {
    expect(formatPrice(1_850_000, "fa")).toBe("۱٬۸۵۰٬۰۰۰");
    expect(formatPrice(1_850_000, "fa", "تومان")).toBe(`۱٬۸۵۰٬۰۰۰${NBSP}تومان`);
  });

  test("English: Latin digits and commas", () => {
    expect(formatPrice(1_850_000, "en")).toBe("1,850,000");
    expect(formatPrice(1_850_000, "en", "Toman")).toBe(`1,850,000${NBSP}Toman`);
  });

  test("Arabic: Arabic-Indic digits and the Arabic thousands separator", () => {
    expect(formatPrice(1_850_000, "ar")).toBe("١٬٨٥٠٬٠٠٠");
    expect(formatPrice(1_850_000, "ar", "تومان")).toBe(`١٬٨٥٠٬٠٠٠${NBSP}تومان`);
  });

  test("rounds to whole Toman and handles zero", () => {
    expect(formatPrice(1999.6, "en")).toBe("2,000");
    expect(formatPrice(0, "fa")).toBe("۰");
    expect(formatPrice(0, "ar")).toBe("٠");
  });

  test("formatNumber never shows decimals", () => {
    expect(formatNumber(12.5, "en")).toBe("13");
  });
});

describe("formatDate", () => {
  // 21 March 2026 (Nowruz) at noon Tehran time.
  const nowruz = "2026-03-21T08:30:00Z";

  test("Persian uses the Solar Hijri calendar", () => {
    expect(formatDate(nowruz, "fa", { year: "numeric", month: "numeric", day: "numeric" })).toBe("۱۴۰۵/۱/۱");
  });

  test("English and Arabic use the Gregorian calendar", () => {
    expect(formatDate(nowruz, "en", { year: "numeric", month: "numeric", day: "numeric" })).toBe("3/21/2026");
    expect(formatDate(nowruz, "ar", { year: "numeric", month: "numeric", day: "numeric" })).toContain("٢٠٢٦");
  });
});
