"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";

import { OrderStatusBadge } from "@/components/account/account-ui";
import { Pill } from "@/components/admin/admin-ui";
import { adminTableFeatures, DataTable } from "@/components/admin/data-table";
import { Link } from "@/i18n/navigation";
import type { AdminOrderRow } from "@/lib/admin/orders";
import { formatDate, formatPrice } from "@/lib/format";

const helper = createColumnHelper<typeof adminTableFeatures, AdminOrderRow>();

export function OrdersTable(props: {
  rows: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: number;
  sort: string;
  desc: boolean;
}) {
  const t = useTranslations("admin.orders");
  const tCheckout = useTranslations("checkout.payment.methods");
  const locale = useLocale();
  const toman = useTranslations("common")("toman");

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("orderNumber", {
          header: t("columns.number"),
          cell: (info) => (
            <Link href={`/admin/orders/${info.getValue()}`} className="font-medium whitespace-nowrap hover:text-primary" dir="ltr">
              {info.getValue()}
            </Link>
          ),
        }),
        helper.accessor("createdAt", {
          header: t("columns.date"),
          cell: (info) => (
            <time dateTime={info.getValue()} className="whitespace-nowrap">
              {formatDate(info.getValue(), locale, { dateStyle: "medium", timeStyle: "short" })}
            </time>
          ),
        }),
        helper.accessor("customerName", {
          header: t("columns.customer"),
          enableSorting: false,
          cell: (info) => (
            <div>
              <p className="font-medium">{info.getValue() || "—"}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">{info.row.original.customerPhone}</p>
            </div>
          ),
        }),
        helper.accessor("type", {
          header: t("columns.type"),
          enableSorting: false,
          cell: (info) => <Pill tone={info.getValue() === "WHOLESALE" ? "blue" : "muted"}>{t(`types.${info.getValue()}`)}</Pill>,
        }),
        helper.accessor("paymentMethod", {
          header: t("columns.payment"),
          enableSorting: false,
          cell: (info) => (
            <span className="whitespace-nowrap">
              {tCheckout(`${info.getValue()}.name`)}
              {info.row.original.hasReceipt && info.row.original.status === "PENDING" ? (
                <span className="ms-1"><Pill tone="gold">{t("receiptWaiting")}</Pill></span>
              ) : null}
            </span>
          ),
        }),
        helper.accessor("total", {
          header: t("columns.total"),
          cell: (info) => <span className="font-semibold whitespace-nowrap">{formatPrice(info.getValue(), locale, toman)}</span>,
        }),
        helper.accessor("status", { header: t("columns.status"), cell: (info) => <OrderStatusBadge status={info.getValue()} /> }),
      ]),
    [t, tCheckout, locale, toman],
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
      getRowId={(row) => row.orderNumber}
      emptyText={t("empty")}
      caption={t("title")}
    />
  );
}
