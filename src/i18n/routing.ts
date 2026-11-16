import { defineRouting } from "next-intl/routing";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export const routing = defineRouting({
  locales: ["fa", "en", "ar"],
  defaultLocale: "fa",
  localePrefix: "always",
  // Locale resolution is: URL prefix → saved cookie → default (fa).
  // The cookie step lives in `src/proxy.ts`; `Accept-Language` is ignored on
  // purpose so first-time visitors always land on the Persian storefront.
  localeDetection: false,
  localeCookie: {
    name: LOCALE_COOKIE_NAME,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
});

export type AppLocale = (typeof routing.locales)[number];
