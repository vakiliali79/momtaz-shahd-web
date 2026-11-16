import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { DealerForm } from "@/components/admin/dealers/dealer-form";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.dealers");
  return { title: t("new") };
}

async function NewDealer() {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/dealers/new");
  const t = await getTranslations("admin.dealers");
  return (
    <div className="mx-auto max-w-4xl">
      <AdminHeading title={t("new")} />
      <DealerForm dealerId={null} />
    </div>
  );
}

export default function NewDealerPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <NewDealer />
    </Suspense>
  );
}
