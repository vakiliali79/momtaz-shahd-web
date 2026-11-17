"use client";

import { useTransition } from "react";
import {
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { PAGE_SIZES } from "@/lib/admin/list-params";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Features for every admin table: sorting and pagination happen on the server. */
export const adminTableFeatures = tableFeatures({ rowSortingFeature, rowPaginationFeature });
export type AdminColumn<TData extends RowData> = ColumnDef<typeof adminTableFeatures, TData, unknown>;

function resolve<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function" ? (updater as (old: T) => T)(current) : updater;
}

/** Writes table state into the URL; the server page reads it and fetches that page. */
export function useListNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(changes: Record<string, string | null>, resetPage = true) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    if (resetPage) next.delete("page");
    startTransition(() => {
      router.replace(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, { scroll: false });
    });
  }

  return { update, pending, searchParams };
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  rowCount,
  page,
  pageSize,
  sort,
  desc,
  getRowId,
  emptyText,
  caption,
}: {
  /** Stable (memoized) column definitions. */
  columns: AdminColumn<TData>[];
  data: TData[];
  rowCount: number;
  page: number;
  pageSize: number;
  sort: string;
  desc: boolean;
  getRowId: (row: TData) => string;
  emptyText: string;
  caption: string;
}) {
  const { update, pending } = useListNavigation();
  const sorting: SortingState = [{ id: sort, desc }];
  const pagination: PaginationState = { pageIndex: page - 1, pageSize };

  const table = useTable({
    features: adminTableFeatures,
    columns,
    data,
    getRowId,
    rowCount,
    manualSorting: true,
    manualPagination: true,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      const next = resolve(updater, sorting)[0];
      update(next ? { sort: next.id, dir: next.desc ? "desc" : "asc" } : { sort: null, dir: null });
    },
    onPaginationChange: (updater) => {
      const next = resolve(updater, pagination);
      if (next.pageSize !== pageSize) update({ size: String(next.pageSize) });
      else update({ page: next.pageIndex > 0 ? String(next.pageIndex + 1) : null }, false);
    },
  });

  return (
    <div className={cn("space-y-3 transition-opacity", pending && "opacity-60")} aria-busy={pending}>
      <div className="relative overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[40rem] text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sorted ? (sorted === "desc" ? "descending" : "ascending") : undefined}
                      className="p-3 text-start font-medium whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex min-h-11 items-center gap-1 rounded hover:text-foreground"
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUpIcon className="size-3.5" aria-hidden="true" />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowUpDownIcon className="size-3.5 opacity-40" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-10 text-center text-muted-foreground">
                  {emptyText}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className="p-3 align-middle">
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPager
        page={page}
        pageSize={pageSize}
        rowCount={rowCount}
        onPage={(next) => table.setPageIndex(next - 1)}
        onPageSize={(size) => table.setPageSize(size)}
      />
    </div>
  );
}

/** "1–20 of 135", page size and previous/next buttons. */
export function ListPager({
  page,
  pageSize,
  rowCount,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  rowCount: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const t = useTranslations("admin.table");
  const locale = useLocale();
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize));
  return (
  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
    <p className="text-muted-foreground" role="status">
      {t("summary", {
        from: formatNumber(rowCount === 0 ? 0 : (page - 1) * pageSize + 1, locale),
        to: formatNumber(Math.min(page * pageSize, rowCount), locale),
        total: formatNumber(rowCount, locale),
      })}
    </p>
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 text-muted-foreground">
        <span>{t("perPage")}</span>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSize(Number(value))}>
          <SelectTrigger className="h-9! w-20 rounded-lg" aria-label={t("perPage")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {formatNumber(size, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label={t("previous")}
        className="grid size-11 shrink-0 place-items-center rounded-xl border border-border hover:bg-muted disabled:opacity-40"
      >
        <ChevronRightIcon className="size-4 ltr:rotate-180" aria-hidden="true" />
      </button>
      <span className="tabular-nums">
        {t("page", { page: formatNumber(page, locale), total: formatNumber(pageCount, locale) })}
      </span>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
        aria-label={t("next")}
        className="grid size-11 shrink-0 place-items-center rounded-xl border border-border hover:bg-muted disabled:opacity-40"
      >
        <ChevronLeftIcon className="size-4 ltr:rotate-180" aria-hidden="true" />
      </button>
    </div>
  </div>
  );
}

/** ListPager wired to the list URL (?page=&size=), for lists that are not tables. */
export function UrlPager({ page, pageSize, rowCount }: { page: number; pageSize: number; rowCount: number }) {
  const { update } = useListNavigation();
  return (
    <ListPager
      page={page}
      pageSize={pageSize}
      rowCount={rowCount}
      onPage={(next) => update({ page: next > 1 ? String(next) : null }, false)}
      onPageSize={(size) => update({ size: String(size) })}
    />
  );
}
