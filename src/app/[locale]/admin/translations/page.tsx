import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { UrlPager } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { TranslationRows } from "@/components/admin/translations/translation-rows";
import { parseFilter, parseListParams } from "@/lib/admin/list-params";
import { messageNamespaces } from "@/lib/admin/translation-files";
import { listTranslations, translationStateFilters } from "@/lib/admin/translations";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.translations");
  return { title: t("title") };
}

async function Translations({ searchParams }: { searchParams: PageProps<"/[locale]/admin/translations">["searchParams"] }) {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/translations");
  const raw = await searchParams;
  const params = parseListParams(raw, ["key"], { sort: "key", desc: false, pageSize: 20 });
  const namespace = parseFilter(raw, "ns", messageNamespaces);
  const state = parseFilter(raw, "state", translationStateFilters);
  const [t, { rows, total }] = await Promise.all([
    getTranslations("admin.translations"),
    listTranslations({ q: params.q, namespace, state, page: params.page, pageSize: params.pageSize }),
  ]);

  return (
    <>
      <AdminHeading title={t("title")} description={t("description")} />
      <ListToolbar
        searchPlaceholder={t("search")}
        filters={[
          { key: "ns", label: t("section"), options: messageNamespaces.map((value) => ({ value, label: value })) },
          { key: "state", label: t("state"), options: translationStateFilters.map((value) => ({ value, label: t(`states.${value}`) })) },
        ]}
      />
      <div className="space-y-4">
        <TranslationRows rows={rows} />
        <UrlPager page={params.page} pageSize={params.pageSize} rowCount={total} />
      </div>
    </>
  );
}

export default function TranslationsPage({ searchParams }: PageProps<"/[locale]/admin/translations">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Translations searchParams={searchParams} />
    </Suspense>
  );
}
