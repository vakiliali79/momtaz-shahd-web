import type { Metadata } from "next";
import { Suspense } from "react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { ProductListing, ProductListingBodySkeleton } from "@/components/catalog/product-listing";
import { PageHeader } from "@/components/shared/page-header";
import { routing } from "@/i18n/routing";
import { parseCatalogParams } from "@/lib/catalog-query";
import { getCatalog } from "@/lib/data/catalog";
import { pageMetadata } from "@/lib/seo";
import { PLACEHOLDER_IMAGE } from "@/lib/site";

export async function generateStaticParams() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return [];
  const { categories } = await getCatalog(locale);
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/category/[slug]">): Promise<Metadata> {
  const [locale, { slug }] = await Promise.all([rootLocale(), params]);
  if (!hasLocale(routing.locales, locale)) return {};
  const { categories } = await getCatalog(locale);
  const category = categories.find((entry) => entry.slug === slug);
  if (!category) return {};

  return pageMetadata({
    locale,
    path: `/category/${category.slug}`,
    title: category.name,
    description: category.description,
    image: category.image === PLACEHOLDER_IMAGE ? undefined : category.image,
  });
}

/** The filtered list depends on the URL query, so it streams in after the static header. */
async function CategoryListing({
  catalog,
  slug,
  searchParams,
}: {
  catalog: Awaited<ReturnType<typeof getCatalog>>;
  slug: string;
  searchParams: PageProps<"/[locale]/category/[slug]">["searchParams"];
}) {
  return (
    <ProductListing catalog={catalog} params={parseCatalogParams(await searchParams)} basePath={`/category/${slug}`} fixedCategory={slug} />
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/category/[slug]">) {
  const [locale, { slug }] = await Promise.all([rootLocale(), params]);
  if (!hasLocale(routing.locales, locale)) notFound();

  const [t, catalog] = await Promise.all([
    getTranslations("catalog"),
    getCatalog(locale),
  ]);
  const category = catalog.categories.find((entry) => entry.slug === slug);
  if (!category) notFound();

  return (
    <>
      <PageHeader
        title={category.name}
        description={category.description}
        crumbs={[{ label: t("title"), href: "/products" }, { label: category.name }]}
      />
      <Suspense fallback={<ProductListingBodySkeleton />}>
        <CategoryListing catalog={catalog} slug={category.slug} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
