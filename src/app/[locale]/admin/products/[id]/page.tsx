import type { Metadata } from "next";
import { Suspense } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/products/product-form";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCategoryOptions, getProductForEdit } from "@/lib/admin/products";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.products");
  return { title: t("edit") };
}

async function EditProduct({ params }: { params: PageProps<"/[locale]/admin/products/[id]">["params"] }) {
  const [locale, { id }] = await Promise.all([currentLocale(), params]);
  await requireAdmin(locale, `/admin/products/${id}`);
  const [t, product, categories] = await Promise.all([
    getTranslations("admin.products"),
    getProductForEdit(id),
    getCategoryOptions(locale),
  ]);
  if (!product) notFound();
  const { id: productId, ...initial } = product;

  return (
    <>
      <AdminHeading
        title={t("editNamed", { name: product.name[locale] })}
        actions={
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/products/${product.slug}`} target="_blank">
              <ExternalLinkIcon className="rtl:-scale-x-100" aria-hidden="true" />
              {t("viewInStore")}
            </Link>
          </Button>
        }
      />
      <ProductForm key={productId} productId={productId} initial={initial} categories={categories} />
    </>
  );
}

export default function EditProductPage({ params }: PageProps<"/[locale]/admin/products/[id]">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <EditProduct params={params} />
    </Suspense>
  );
}
