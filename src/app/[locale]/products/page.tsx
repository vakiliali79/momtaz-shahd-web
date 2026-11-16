import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { ProductListing } from "@/components/catalog/product-listing";
import { PageHeader } from "@/components/shared/page-header";
import { routing } from "@/i18n/routing";
import { parseCatalogParams } from "@/lib/catalog-query";
import { getCatalog } from "@/lib/data/catalog";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations("catalog");
  return pageMetadata({
    locale,
    path: "/products",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ProductsPage({
  searchParams,
}: PageProps<"/[locale]/products">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  const [t, catalog, rawParams] = await Promise.all([
    getTranslations("catalog"),
    getCatalog(locale),
    searchParams,
  ]);

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        crumbs={[{ label: t("title") }]}
      />
      <ProductListing
        catalog={catalog}
        params={parseCatalogParams(rawParams)}
        basePath="/products"
      />
    </>
  );
}
