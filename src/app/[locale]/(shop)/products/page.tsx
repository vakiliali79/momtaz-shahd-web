import type { Metadata } from "next";
import { Suspense } from "react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { ProductListing, ProductListingBodySkeleton } from "@/components/catalog/product-listing";
import { PageHeader } from "@/components/shared/page-header";
import { routing, type AppLocale } from "@/i18n/routing";
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

/** The filtered list depends on the URL query, so it streams in after the static header. */
async function Listing({ locale, searchParams }: { locale: AppLocale; searchParams: PageProps<"/[locale]/products">["searchParams"] }) {
  const [catalog, rawParams] = await Promise.all([getCatalog(locale), searchParams]);
  return <ProductListing catalog={catalog} params={parseCatalogParams(rawParams)} basePath="/products" />;
}

export default async function ProductsPage({
  searchParams,
}: PageProps<"/[locale]/products">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("catalog");

  // The header is part of the prerendered page; only the listing waits for the query.
  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        crumbs={[{ label: t("title") }]}
      />
      <Suspense fallback={<ProductListingBodySkeleton />}>
        <Listing locale={locale} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
