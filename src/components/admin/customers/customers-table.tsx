"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";

import { Pill } from "@/components/admin/admin-ui";
import { adminTableFeatures, DataTable } from "@/components/admin/data-table";
import { Link } from "@/i18n/navigation";
import type { AdminCustomerRow } from "@/lib/admin/customers";
import { formatDate, formatNumber } from "@/lib/format";

const helper = createColumnHelper<typeof adminTableFeatures, AdminCustomerRow>();

export const roleTone = { CUSTOMER: "muted", WHOLESALE: "blue", ADMIN: "gold" } as const;

export function CustomersTable(props: {
  rows: AdminCustomerRow[];
  total: number;
  page: number;
  pageSize: number;
  sort: string;
  desc: boolean;
}) {
  const t = useTranslations("admin.customers");
  const locale = useLocale();

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("name", {
          header: t("columns.name"),
          cell: (info) => (
            <div>
              <Link href={`/admin/customers/${info.row.original.id}`} className="touch-target font-medium hover:text-primary">
                {info.getValue() || t("noName")}
              </Link>
              {info.row.original.email ? <p className="text-xs text-muted-foreground" dir="ltr">{info.row.original.email}</p> : null}
            </div>
          ),
        }),
        helper.accessor("phone", {
          header: t("columns.phone"),
          enableSorting: false,
          cell: (info) => <span dir="ltr" className="whitespace-nowrap">{info.getValue()}</span>,
        }),
        helper.accessor("role", {
          header: t("columns.role"),
          enableSorting: false,
          cell: (info) => <Pill tone={roleTone[info.getValue()]}>{t(`roles.${info.getValue()}`)}</Pill>,
        }),
        helper.accessor("orderCount", {
          id: "orders",
          header: t("columns.orders"),
          cell: (info) => formatNumber(info.getValue(), locale),
        }),
        helper.accessor("isBlocked", {
          header: t("columns.state"),
          enableSorting: false,
          cell: (info) => (info.getValue() ? <Pill tone="red">{t("states.blocked")}</Pill> : <Pill tone="green">{t("states.active")}</Pill>),
        }),
        helper.accessor("createdAt", {
          header: t("columns.joined"),
          cell: (info) => (
            <time dateTime={info.getValue()} className="whitespace-nowrap">{formatDate(info.getValue(), locale, { dateStyle: "medium" })}</time>
          ),
        }),
      ]),
    [t, locale],
  );

  return (
    <DataTable
      columns={columns}
      data={props.rows}
      rowCount={props.total}
      page={props.page}
      pageSize={props.pageSize}
      sort={props.sort}
      desc={props.desc}
      getRowId={(row) => row.id}
      emptyText={t("empty")}
      caption={t("title")}
    />
  );
}
