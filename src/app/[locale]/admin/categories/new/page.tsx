import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/categories/category-form";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.categories");
  return { title: t("new") };
}

async function NewCategory() {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/categories/new");
  const t = await getTranslations("admin.categories");
  return (
    <>
      <AdminHeading title={t("new")} />
      <CategoryForm categoryId={null} />
    </>
  );
}

export default function NewCategoryPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <NewCategory />
    </Suspense>
  );
}
