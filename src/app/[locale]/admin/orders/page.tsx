import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { OrdersTable } from "@/components/admin/orders/orders-table";
import { parseFilter, parseListParams } from "@/lib/admin/list-params";
import {
  listAdminOrders,
  orderPaymentFilters,
  orderPeriodFilters,
  orderSorts,
  orderStatusFilters,
  orderTypeFilters,
} from "@/lib/admin/orders";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.orders");
  return { title: t("title") };
}

async function Orders({ searchParams }: { searchParams: PageProps<"/[locale]/admin/orders">["searchParams"] }) {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/orders");
  const raw = await searchParams;
  const params = parseListParams(raw, orderSorts, { sort: "createdAt", desc: true });
  const filters = {
    status: parseFilter(raw, "status", orderStatusFilters),
    type: parseFilter(raw, "type", orderTypeFilters),
    payment: parseFilter(raw, "payment", orderPaymentFilters),
    period: parseFilter(raw, "period", orderPeriodFilters),
  };
  const [t, tStatus, tPay, { rows, total }] = await Promise.all([
    getTranslations("admin.orders"),
    getTranslations("order.status"),
    getTranslations("checkout.payment.methods"),
    listAdminOrders(params, filters),
  ]);

  return (
    <>
      <AdminHeading title={t("title")} description={t("description")} />
      <ListToolbar
        searchPlaceholder={t("search")}
        filters={[
          { key: "status", label: t("filters.status"), options: orderStatusFilters.map((v) => ({ value: v, label: tStatus(v) })) },
          { key: "period", label: t("filters.period"), options: orderPeriodFilters.map((v) => ({ value: v, label: t(`periods.${v}`) })) },
          { key: "type", label: t("filters.type"), options: orderTypeFilters.map((v) => ({ value: v, label: t(`types.${v}`) })) },
          { key: "payment", label: t("filters.payment"), options: orderPaymentFilters.map((v) => ({ value: v, label: tPay(`${v}.name`) })) },
        ]}
      />
      <OrdersTable rows={rows} total={total} page={params.page} pageSize={params.pageSize} sort={params.sort} desc={params.desc} />
    </>
  );
}

export default function AdminOrdersPage({ searchParams }: PageProps<"/[locale]/admin/orders">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}
