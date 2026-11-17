import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { WholesaleTable } from "@/components/admin/wholesale/wholesale-table";
import { parseFilter, parseListParams } from "@/lib/admin/list-params";
import { listWholesaleRequests, wholesaleSorts, wholesaleStatuses, wholesaleTypes } from "@/lib/admin/wholesale";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.wholesale");
  return { title: t("title") };
}

async function Requests({ searchParams }: { searchParams: PageProps<"/[locale]/admin/wholesale">["searchParams"] }) {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/wholesale");
  const raw = await searchParams;
  const params = parseListParams(raw, wholesaleSorts, { sort: "createdAt", desc: true });
  const status = parseFilter(raw, "status", wholesaleStatuses);
  const type = parseFilter(raw, "type", wholesaleTypes);
  const [t, { rows, total }] = await Promise.all([getTranslations("admin.wholesale"), listWholesaleRequests(params, { status, type }, locale)]);

  return (
    <>
      <AdminHeading title={t("title")} description={t("description")} />
      <ListToolbar
        searchPlaceholder={t("search")}
        filters={[
          { key: "status", label: t("columns.status"), options: wholesaleStatuses.map((v) => ({ value: v, label: t(`statuses.${v}`) })) },
          { key: "type", label: t("columns.type"), options: wholesaleTypes.map((v) => ({ value: v, label: t(`types.${v}`) })) },
        ]}
      />
      <WholesaleTable rows={rows} total={total} page={params.page} pageSize={params.pageSize} sort={params.sort} desc={params.desc} />
    </>
  );
}

export default function AdminWholesalePage({ searchParams }: PageProps<"/[locale]/admin/wholesale">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Requests searchParams={searchParams} />
    </Suspense>
  );
}
