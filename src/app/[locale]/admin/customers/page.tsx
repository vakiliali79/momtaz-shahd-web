import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { CustomersTable } from "@/components/admin/customers/customers-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { listAdminCustomers, customerRoleFilters, customerSorts, customerStateFilters } from "@/lib/admin/customers";
import { parseFilter, parseListParams } from "@/lib/admin/list-params";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.customers");
  return { title: t("title") };
}

async function Customers({ searchParams }: { searchParams: PageProps<"/[locale]/admin/customers">["searchParams"] }) {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/customers");
  const raw = await searchParams;
  const params = parseListParams(raw, customerSorts, { sort: "createdAt", desc: true });
  const filters = { role: parseFilter(raw, "role", customerRoleFilters), state: parseFilter(raw, "state", customerStateFilters) };
  const [t, { rows, total }] = await Promise.all([getTranslations("admin.customers"), listAdminCustomers(params, filters)]);

  return (
    <>
      <AdminHeading title={t("title")} description={t("description")} />
      <ListToolbar
        searchPlaceholder={t("search")}
        filters={[
          { key: "role", label: t("columns.role"), options: customerRoleFilters.map((v) => ({ value: v, label: t(`roles.${v}`) })) },
          { key: "state", label: t("columns.state"), options: customerStateFilters.map((v) => ({ value: v, label: t(`states.${v}`) })) },
        ]}
      />
      <CustomersTable rows={rows} total={total} page={params.page} pageSize={params.pageSize} sort={params.sort} desc={params.desc} />
    </>
  );
}

export default function AdminCustomersPage({ searchParams }: PageProps<"/[locale]/admin/customers">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Customers searchParams={searchParams} />
    </Suspense>
  );
}
