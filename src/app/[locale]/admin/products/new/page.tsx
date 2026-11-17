import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/products/product-form";
import { getCategoryOptions } from "@/lib/admin/products";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.products");
  return { title: t("new") };
}

async function NewProduct() {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/products/new");
  const [t, categories] = await Promise.all([getTranslations("admin.products"), getCategoryOptions(locale)]);
  return (
    <>
      <AdminHeading title={t("new")} />
      <ProductForm productId={null} categories={categories} />
    </>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <NewProduct />
    </Suspense>
  );
}
