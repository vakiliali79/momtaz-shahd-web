import type { Metadata } from "next";

import { routing, type AppLocale } from "@/i18n/routing";

const OG_LOCALE: Record<AppLocale, string> = {
  fa: "fa_IR",
  en: "en_US",
  ar: "ar_AE",
};

/**
 * Canonical URL plus hreflang alternates for all locales.
 * `path` is the locale-less path, e.g. "/products/walnut-koloocheh-450g".
 */
export function localeAlternates(
  locale: AppLocale,
  path = "",
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])),
      "x-default": `/${routing.defaultLocale}${path}`,
    },
  };
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
}: {
  locale: AppLocale;
  path: string;
  title: string;
  description: string;
  image?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: localeAlternates(locale, path),
    openGraph: {
      type: "website",
      title,
      description,
      url: `/${locale}${path}`,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l]),
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}
