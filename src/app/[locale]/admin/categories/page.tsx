import type { Metadata } from "next";
import { Suspense } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { DeleteCategoryButton } from "@/components/admin/categories/delete-category";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listAdminCategories } from "@/lib/admin/categories";
import { formatNumber } from "@/lib/format";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.categories");
  return { title: t("title") };
}

async function Categories() {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/categories");
  const [t, categories] = await Promise.all([getTranslations("admin.categories"), listAdminCategories(locale)]);

  return (
    <>
      <AdminHeading
        title={t("title")}
        description={t("description")}
        actions={
          <Button asChild className="rounded-full">
            <Link href="/admin/categories/new"><PlusIcon aria-hidden="true" />{t("new")}</Link>
          </Button>
        }
      />
      <div className="relative overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[32rem] text-sm">
          <caption className="sr-only">{t("title")}</caption>
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.name")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.slug")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.products")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.order")}</th>
              <th scope="col" className="p-3"><span className="sr-only">{t("columns.actions")}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">{t("empty")}</td></tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        <ProductImage src={category.image} alt="" sizes="40px" />
                      </span>
                      <Link href={`/admin/categories/${category.id}`} className="touch-target font-medium hover:text-primary">{category.name}</Link>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground" dir="ltr"><span className="block text-start">{category.slug}</span></td>
                  <td className="p-3">{formatNumber(category.productCount, locale)}</td>
                  <td className="p-3">{formatNumber(category.sortOrder, locale)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon-sm" aria-label={t("editFor", { name: category.name })}>
                        <Link href={`/admin/categories/${category.id}`}><PencilIcon aria-hidden="true" /></Link>
                      </Button>
                      <DeleteCategoryButton id={category.id} name={category.name} disabled={category.productCount > 0} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Categories />
    </Suspense>
  );
}
