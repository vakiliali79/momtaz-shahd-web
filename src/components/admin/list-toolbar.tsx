"use client";

import { useId, type FormEvent } from "react";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { useListNavigation } from "@/components/admin/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ToolbarFilter = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

const ALL = "__all";

/** Search box and filter selects that write to the URL. */
export function ListToolbar({
  searchPlaceholder,
  filters = [],
  children,
}: {
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  children?: React.ReactNode;
}) {
  const t = useTranslations("admin.table");
  const id = useId();
  const { update, searchParams } = useListNavigation();

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    update({ q: typeof value === "string" ? value.trim().slice(0, 100) : null });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {searchPlaceholder ? (
        <form role="search" onSubmit={onSearch} className="relative w-full sm:w-72">
          <label htmlFor={id} className="sr-only">{t("search")}</label>
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id={id}
            name="q"
            type="search"
            key={searchParams.get("q") ?? ""}
            defaultValue={searchParams.get("q") ?? ""}
            placeholder={searchPlaceholder}
            className="h-9 rounded-lg ps-9"
          />
        </form>
      ) : null}
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={searchParams.get(filter.key) ?? ALL}
          onValueChange={(value) => update({ [filter.key]: value === ALL ? null : value })}
        >
          <SelectTrigger className="h-9! min-w-36 rounded-lg" aria-label={filter.label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allOf", { label: filter.label })}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {children ? <div className="ms-auto flex items-center gap-2">{children}</div> : null}
    </div>
  );
}
