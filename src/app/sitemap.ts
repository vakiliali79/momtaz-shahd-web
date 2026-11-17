import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getSitemapEntries } from "@/lib/data/sitemap";
import { SITE_URL } from "@/lib/site";

type Entry = MetadataRoute.Sitemap[number];

/** One URL per locale, each listing every language version (hreflang) and x-default. */
function localized(path: string, extra: Omit<Entry, "url" | "alternates"> = {}): Entry[] {
  const languages = {
    ...Object.fromEntries(routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`])),
    "x-default": `${SITE_URL}/${routing.defaultLocale}${path}`,
  };
  return routing.locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    alternates: { languages },
    ...extra,
  }));
}

const staticPages: { path: string; priority: number; changeFrequency: Entry["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/products", priority: 0.9, changeFrequency: "daily" },
  { path: "/wholesale", priority: 0.8, changeFrequency: "monthly" },
  { path: "/dealers", priority: 0.7, changeFrequency: "weekly" },
  { path: "/dealers/apply", priority: 0.5, changeFrequency: "yearly" },
  { path: "/about", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/track", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories, dealers } = await getSitemapEntries();
  return [
    ...staticPages.flatMap(({ path, priority, changeFrequency }) => localized(path, { priority, changeFrequency })),
    ...categories.flatMap((slug) => localized(`/category/${slug}`, { priority: 0.8, changeFrequency: "weekly" })),
    ...products.flatMap(({ slug, updatedAt }) =>
      localized(`/products/${slug}`, { lastModified: updatedAt, priority: 0.8, changeFrequency: "weekly" }),
    ),
    ...dealers.flatMap(({ id, createdAt }) => localized(`/dealers/${id}`, { lastModified: createdAt, priority: 0.5, changeFrequency: "monthly" })),
  ];
}
