"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import { useCatalogNavigation } from "@/components/catalog/use-catalog-navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sortOptions, type CatalogParams, type SortOption } from "@/lib/catalog-query";

const labelKey = {
  newest: "newest",
  "price-asc": "priceAsc",
  "price-desc": "priceDesc",
  rating: "rating",
} as const satisfies Record<SortOption, string>;

function isSortOption(value: string): value is SortOption {
  return sortOptions.some((option) => option === value);
}

export function SortSelect({ params }: { params: CatalogParams }) {
  const t = useTranslations("catalog");
  const id = useId();
  const { update } = useCatalogNavigation(params);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="hidden text-sm whitespace-nowrap text-muted-foreground sm:block">
        {t("sortLabel")}
      </label>
      <Select
        value={params.sort}
        onValueChange={(value) => {
          if (isSortOption(value)) update({ sort: value });
        }}
      >
        <SelectTrigger id={id} aria-label={t("sortLabel")} className="h-10! min-w-40 rounded-full px-4">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {sortOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(`sort.${labelKey[option]}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
