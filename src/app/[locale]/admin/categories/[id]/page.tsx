import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/categories/category-form";
import { getCategoryForEdit } from "@/lib/admin/categories";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.categories");
  return { title: t("edit") };
}

async function EditCategory({ params }: { params: PageProps<"/[locale]/admin/categories/[id]">["params"] }) {
  const [locale, { id }] = await Promise.all([currentLocale(), params]);
  await requireAdmin(locale, `/admin/categories/${id}`);
  const [t, category] = await Promise.all([getTranslations("admin.categories"), getCategoryForEdit(id)]);
  if (!category) notFound();
  const { id: categoryId, ...initial } = category;
  return (
    <>
      <AdminHeading title={t("editNamed", { name: category.name[locale] })} />
      <CategoryForm key={categoryId} categoryId={categoryId} initial={initial} />
    </>
  );
}

export default function EditCategoryPage({ params }: PageProps<"/[locale]/admin/categories/[id]">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <EditCategory params={params} />
    </Suspense>
  );
}
