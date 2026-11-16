import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { CartView } from "@/components/cart/cart-view";
import { PageHeader } from "@/components/shared/page-header";
import { routing } from "@/i18n/routing";
import { getShippingConfig } from "@/lib/data/settings";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations("cart");
  return {
    ...pageMetadata({ locale, path: "/cart", title: t("title"), description: t("description") }),
    // A visitor's cart is not a page for search engines.
    robots: { index: false, follow: true },
  };
}

export default async function CartPage() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  const [t, shipping] = await Promise.all([getTranslations("cart"), getShippingConfig()]);

  return (
    <>
      <PageHeader title={t("title")} crumbs={[{ label: t("title") }]} />
      {/* The cart lives in the browser, so its contents render on the client. */}
      <CartView shipping={shipping} />
    </>
  );
}
