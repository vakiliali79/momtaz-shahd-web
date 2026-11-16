import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { DealerForm } from "@/components/admin/dealers/dealer-form";
import { getDealerForEdit } from "@/lib/admin/dealers";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.dealers");
  return { title: t("edit") };
}

async function EditDealer({ params }: { params: PageProps<"/[locale]/admin/dealers/[id]">["params"] }) {
  const [locale, { id }] = await Promise.all([currentLocale(), params]);
  await requireAdmin(locale, `/admin/dealers/${id}`);
  const dealer = await getDealerForEdit(id);
  if (!dealer) notFound();
  const t = await getTranslations("admin.dealers");
  return (
    <div className="mx-auto max-w-4xl">
      <AdminHeading title={t("editNamed", { name: dealer.name[locale] })} />
      <DealerForm dealerId={id} initial={dealer} />
    </div>
  );
}

export default function EditDealerPage({ params }: PageProps<"/[locale]/admin/dealers/[id]">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <EditDealer params={params} />
    </Suspense>
  );
}
