"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";

import { Pill } from "@/components/admin/admin-ui";
import { adminTableFeatures, DataTable } from "@/components/admin/data-table";
import { Link } from "@/i18n/navigation";
import type { AdminWholesaleRow } from "@/lib/admin/wholesale";
import type { WholesaleStatus } from "@/lib/admin/wholesale-statuses";
import { formatDate } from "@/lib/format";

const helper = createColumnHelper<typeof adminTableFeatures, AdminWholesaleRow>();

export const wholesaleTone: Record<WholesaleStatus, "gold" | "blue" | "green" | "muted"> = {
  NEW: "gold",
  CONTACTED: "blue",
  CONVERTED: "green",
  REJECTED: "muted",
};

export function WholesaleTable(props: {
  rows: AdminWholesaleRow[];
  total: number;
  page: number;
  pageSize: number;
  sort: string;
  desc: boolean;
}) {
  const t = useTranslations("admin.wholesale");
  const locale = useLocale();

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("companyName", {
          header: t("columns.company"),
          cell: (info) => (
            <Link href={`/admin/wholesale/${info.row.original.id}`} className="font-medium hover:text-primary">
              {info.getValue()}
            </Link>
          ),
        }),
        helper.accessor("contactName", {
          header: t("columns.contact"),
          enableSorting: false,
          cell: (info) => (
            <div>
              <p>{info.getValue()}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">{info.row.original.phone}</p>
            </div>
          ),
        }),
        helper.accessor("city", { header: t("columns.city"), enableSorting: false }),
        helper.accessor("status", {
          header: t("columns.status"),
          cell: (info) => <Pill tone={wholesaleTone[info.getValue()]}>{t(`statuses.${info.getValue()}`)}</Pill>,
        }),
        helper.accessor("createdAt", {
          header: t("columns.date"),
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
