import { hasLocale, type Messages } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";

import { applyOverrides, getTranslationOverrides } from "@/lib/i18n/overrides";

import { routing } from "./routing";

export default getRequestConfig(async ({ locale: override }) => {
  const requested = override ?? (await rootLocale());
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [file, overrides] = await Promise.all([
    import(`../../messages/${locale}.json`).then((module: { default: Messages }) => module.default),
    getTranslationOverrides(locale),
  ]);

  return {
    locale,
    // Texts edited in Admin → Translations win over the message files.
    messages: applyOverrides(file, overrides),
    timeZone: "Asia/Tehran",
  };
});
