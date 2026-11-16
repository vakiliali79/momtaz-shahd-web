import type { Metadata } from "next";
import { Suspense } from "react";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { ProductsTable } from "@/components/admin/products/products-table";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { parseFilter, parseListParams } from "@/lib/admin/list-params";
import {
  getCategoryOptions,
  listAdminProducts,
  productSorts,
  productStatusFilters,
  productStockFilters,
} from "@/lib/admin/products";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.products");
  return { title: t("title") };
}

async function Products({ searchParams }: { searchParams: PageProps<"/[locale]/admin/products">["searchParams"] }) {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/products");
  const raw = await searchParams;
  const params = parseListParams(raw, productSorts, { sort: "createdAt", desc: true });
  const categories = await getCategoryOptions(locale);
  const filters = {
    category: parseFilter(raw, "category", categories.map((c) => c.slug)),
    status: parseFilter(raw, "status", productStatusFilters),
    stock: parseFilter(raw, "stock", productStockFilters),
  };
  const [t, { rows, total }] = await Promise.all([
    getTranslations("admin.products"),
    listAdminProducts(params, filters, locale),
  ]);

  return (
    <>
      <AdminHeading
        title={t("title")}
        description={t("description")}
        actions={
          <Button asChild className="rounded-full">
            <Link href="/admin/products/new">
              <PlusIcon aria-hidden="true" />
              {t("new")}
            </Link>
          </Button>
        }
      />
      <ListToolbar
        searchPlaceholder={t("search")}
        filters={[
          { key: "category", label: t("filters.category"), options: categories.map((c) => ({ value: c.slug, label: c.label })) },
          { key: "status", label: t("filters.status"), options: productStatusFilters.map((v) => ({ value: v, label: t(`filters.${v}`) })) },
          { key: "stock", label: t("filters.stock"), options: productStockFilters.map((v) => ({ value: v, label: t(`filters.${v}`) })) },
        ]}
      />
      <ProductsTable rows={rows} total={total} page={params.page} pageSize={params.pageSize} sort={params.sort} desc={params.desc} />
    </>
  );
}

export default function ProductsPage({ searchParams }: PageProps<"/[locale]/admin/products">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Products searchParams={searchParams} />
    </Suspense>
  );
}
