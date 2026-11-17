import { PackageSearchIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { CatalogSearch } from "@/components/catalog/catalog-search";
import { Filters, type FilterCategory } from "@/components/catalog/filters";
import { MobileFilters } from "@/components/catalog/mobile-filters";
import { Pagination } from "@/components/catalog/pagination";
import { SortSelect } from "@/components/catalog/sort-select";
import { Container } from "@/components/layout/container";
import {
  ProductGrid,
  ProductGridSkeleton,
  productGridWithSidebarClass,
} from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import {
  getPriceBounds,
  queryCatalog,
  type CatalogParams,
} from "@/lib/catalog-query";
import type { Catalog } from "@/lib/data/catalog";
import { formatNumber } from "@/lib/format";

export function ProductListing({
  catalog,
  params,
  basePath,
  fixedCategory,
}: {
  catalog: Catalog;
  params: CatalogParams;
  /** Locale-less path of the page, e.g. "/products" or "/category/koloocheh". */
  basePath: string;
  /** On category pages: limits the listing to this category slug. */
  fixedCategory?: string;
}) {
  const t = useTranslations("catalog");
  const locale = useLocale();

  const scope = fixedCategory
    ? catalog.products.filter((product) => product.categorySlug === fixedCategory)
    : catalog.products;
  const result = queryCatalog(scope, fixedCategory ? { ...params, category: [] } : params);
  const bounds = getPriceBounds(scope);
  const categories: FilterCategory[] = catalog.categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    count: category.productCount,
  }));
  const filterProps = {
    params,
    categories,
    bounds,
    showCategories: !fixedCategory,
  };

  return (
    <Container className="grid gap-8 py-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 lg:py-10">
      <aside aria-label={t("filters")} className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-5 font-semibold">{t("filters")}</h2>
          <Filters {...filterProps} />
        </div>
      </aside>

      <section aria-label={t("results")} className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <MobileFilters {...filterProps} total={result.total} />
          <CatalogSearch params={params} className="order-last w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-xs" />
          <p role="status" className="ms-auto text-sm text-muted-foreground">
            {params.q
              ? t("resultCountFor", {
                  count: result.total,
                  formatted: formatNumber(result.total, locale),
                  query: params.q,
                })
              : t("resultCount", {
                  count: result.total,
                  formatted: formatNumber(result.total, locale),
                })}
          </p>
          <SortSelect params={params} />
        </div>

        {result.total === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-input px-4 py-16 text-center">
            <PackageSearchIcon className="size-12 text-gold-ink" strokeWidth={1.25} aria-hidden="true" />
            <h2 className="mt-4 text-fluid-lg font-semibold">{t("emptyTitle")}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("emptyDescription")}</p>
            <Button asChild variant="outline" size="lg" className="mt-5 rounded-full px-5">
              <Link href={basePath}>{t("clearFilters")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <h2 className="sr-only">{t("resultsTitle")}</h2>
            <ProductGrid products={result.items} className={productGridWithSidebarClass} />
            <Pagination
              basePath={basePath}
              params={params}
              page={result.page}
              pageCount={result.pageCount}
            />
          </>
        )}
      </section>
    </Container>
  );
}

/** Skeleton shown by loading.tsx while a listing page streams in. */
/** The filters, toolbar and grid placeholders (below a real page header). */
export function ProductListingBodySkeleton() {
  return (
    <>
      <Container className="grid gap-8 py-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 lg:py-10">
        <div className="hidden lg:block">
          <Skeleton className="h-96 rounded-2xl" />
        </div>
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-28 rounded-full lg:hidden" />
            <Skeleton className="h-10 w-full rounded-full sm:w-64" />
            <Skeleton className="ms-auto h-10 w-40 rounded-full" />
          </div>
          <ProductGridSkeleton className={productGridWithSidebarClass} />
        </div>
      </Container>
    </>
  );
}
