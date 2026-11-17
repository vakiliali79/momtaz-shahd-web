import { describe, expect, test } from "vitest";

import { safeCallbackUrl } from "./auth";

describe("safeCallbackUrl (no open redirects after sign-in)", () => {
  const fallback = "/fa";

  test("keeps paths on this site", () => {
    expect(safeCallbackUrl("/fa/account/orders?page=2", fallback)).toBe("/fa/account/orders?page=2");
  });

  test.each([
    "https://evil.example/",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    " /fa",
    "javascript:alert(1)",
    "fa/account",
  ])("rejects %j", (value) => {
    expect(safeCallbackUrl(value, fallback)).toBe(fallback);
  });

  test("rejects non-strings and very long values", () => {
    expect(safeCallbackUrl(undefined, fallback)).toBe(fallback);
    expect(safeCallbackUrl(["/fa"], fallback)).toBe(fallback);
    expect(safeCallbackUrl(`/${"a".repeat(600)}`, fallback)).toBe(fallback);
  });
});
