"use client";

import { useMemo, useState, useTransition, type KeyboardEvent } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { CopyIcon, PencilIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { duplicateProduct, setProductActive, setProductStock } from "@/actions/admin/products";
import { Pill } from "@/components/admin/admin-ui";
import { adminTableFeatures, DataTable } from "@/components/admin/data-table";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/i18n/navigation";
import type { AdminProductRow } from "@/lib/admin/products";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toLatinDigits } from "@/lib/validation/phone";

const helper = createColumnHelper<typeof adminTableFeatures, AdminProductRow>();

/** Stock number that saves on Enter or when the field loses focus. */
function StockCell({ row }: { row: AdminProductRow }) {
  const t = useTranslations("admin.products");
  const tErrors = useTranslations("admin.errors");
  const locale = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(String(row.stock));
  const [pending, startTransition] = useTransition();

  function save() {
    const next = Number(toLatinDigits(value).replace(/\D/g, ""));
    if (!Number.isFinite(next) || next === row.stock || value.trim() === "") {
      setValue(String(row.stock));
      return;
    }
    startTransition(async () => {
      const result = await setProductStock(row.id, next);
      if (result.ok) {
        toast.success(t("stockSaved", { name: row.name, stock: formatNumber(next, locale) }));
        router.refresh();
      } else {
        toast.error(tErrors(result.error));
        setValue(String(row.stock));
      }
    });
  }

  return (
    <Input
      value={value}
      inputMode="numeric"
      dir="ltr"
      aria-label={t("stockFor", { name: row.name })}
      disabled={pending}
      onChange={(event) => setValue(event.target.value)}
      onBlur={save}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setValue(String(row.stock));
          event.currentTarget.blur();
        }
      }}
      className={cn("h-8 w-20 rounded-lg text-center tabular-nums", row.stock <= 0 && "border-destructive/60 text-destructive")}
    />
  );
}

function ActiveCell({ row }: { row: AdminProductRow }) {
  const t = useTranslations("admin.products");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Switch
      checked={row.isActive}
      disabled={pending}
      aria-label={t("activeFor", { name: row.name })}
      onCheckedChange={(checked) =>
        startTransition(async () => {
          const result = await setProductActive(row.id, checked);
          if (result.ok) router.refresh();
          else toast.error(tErrors(result.error));
        })
      }
    />
  );
}

function ActionsCell({ row }: { row: AdminProductRow }) {
  const t = useTranslations("admin.products");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex justify-end gap-1">
      <Button asChild variant="ghost" size="icon-sm" aria-label={t("editFor", { name: row.name })}>
        <Link href={`/admin/products/${row.id}`}>
          <PencilIcon aria-hidden="true" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label={t("duplicateFor", { name: row.name })}
        onClick={() =>
          startTransition(async () => {
            const result = await duplicateProduct(row.id);
            if (result.ok) {
              toast.success(t("duplicated"));
              router.push(`/${locale}/admin/products/${result.data.id}`);
            } else toast.error(tErrors(result.error));
          })
        }
      >
        <CopyIcon aria-hidden="true" />
      </Button>
    </div>
  );
}

export function ProductsTable(props: {
  rows: AdminProductRow[];
  total: number;
  page: number;
  pageSize: number;
  sort: string;
  desc: boolean;
}) {
  const t = useTranslations("admin.products");
  const locale = useLocale();
  const toman = useTranslations("common")("toman");

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("name", {
          header: t("columns.name"),
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="flex items-center gap-3">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  <ProductImage src={row.image} alt="" sizes="44px" />
                </span>
                <div className="min-w-0">
                  <Link href={`/admin/products/${row.id}`} className="touch-target font-medium hover:text-primary">
                    {row.name}
                  </Link>
                  <p className="text-xs text-muted-foreground" dir="ltr">{row.slug}</p>
                </div>
              </div>
            );
          },
        }),
        helper.accessor("categoryName", { id: "category", header: t("columns.category") }),
        helper.accessor("price", {
          header: t("columns.price"),
          cell: (info) => {
            const row = info.row.original;
            return (
              <span className="whitespace-nowrap">
                {row.discountPrice !== null ? (
                  <>
                    <s className="block text-xs text-muted-foreground">{formatPrice(row.price, locale)}</s>
                    {formatPrice(row.discountPrice, locale, toman)}
                  </>
                ) : (
                  formatPrice(row.price, locale, toman)
                )}
              </span>
            );
          },
        }),
        helper.accessor("stock", { header: t("columns.stock"), cell: (info) => <StockCell key={`${info.row.original.id}-${info.row.original.stock}`} row={info.row.original} /> }),
        helper.accessor("isActive", {
          header: t("columns.active"),
          enableSorting: false,
          cell: (info) => <ActiveCell row={info.row.original} />,
        }),
        helper.accessor("isFeatured", {
          header: t("columns.featured"),
          enableSorting: false,
          cell: (info) => (info.getValue() ? <Pill tone="gold">{t("featured")}</Pill> : null),
        }),
        helper.accessor("createdAt", {
          header: t("columns.created"),
          cell: (info) => (
            <time dateTime={info.getValue()} className="whitespace-nowrap text-muted-foreground">
              {formatDate(info.getValue(), locale, { dateStyle: "medium" })}
            </time>
          ),
        }),
        helper.display({ id: "actions", header: () => <span className="sr-only">{t("columns.actions")}</span>, cell: (info) => <ActionsCell row={info.row.original} /> }),
      ]),
    [t, locale, toman],
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
