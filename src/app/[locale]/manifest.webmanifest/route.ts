import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { getDirection } from "@/i18n/locales";
import { routing } from "@/i18n/routing";

/** Web app manifest in the visitor's language (name, direction, start page). */
export async function GET(_request: Request, { params }: RouteContext<"/[locale]/manifest.webmanifest">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return new Response(null, { status: 404 });
  const t = await getTranslations({ locale });

  const manifest = {
    id: `/${locale}`,
    name: t("metadata.siteName"),
    short_name: t("brand.name"),
    description: t("metadata.description"),
    lang: locale,
    dir: getDirection(locale),
    start_url: `/${locale}?source=pwa`,
    scope: `/${locale}/`,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f5e6d3",
    theme_color: "#c8102e",
    categories: ["food", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: t("nav.products"), url: `/${locale}/products`, icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: t("cart.title"), url: `/${locale}/cart`, icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: t("track.title"), url: `/${locale}/track`, icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };

  return Response.json(manifest, {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" },
  });
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
