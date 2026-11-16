"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useCatalogNavigation } from "@/components/catalog/use-catalog-navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { countActiveFilters, type CatalogParams } from "@/lib/catalog-query";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type FilterCategory = { slug: string; name: string; count: number };
export type PriceBounds = { min: number; max: number; step: number };

export function Filters({
  params,
  categories,
  bounds,
  showCategories = true,
  className,
}: {
  params: CatalogParams;
  categories: readonly FilterCategory[];
  bounds: PriceBounds;
  /** Hidden on category pages, where the category is fixed by the URL. */
  showCategories?: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const id = useId();
  const { update, clear, isPending } = useCatalogNavigation(params);

  const urlRange: [number, number] = [
    Math.max(bounds.min, Math.min(params.min ?? bounds.min, bounds.max)),
    Math.min(bounds.max, Math.max(params.max ?? bounds.max, bounds.min)),
  ];
  // Local copy so the labels follow the thumbs while dragging; it is reset
  // whenever the URL changes (e.g. "clear filters" or back navigation).
  const urlKey = urlRange.join("-");
  const [draft, setDraft] = useState({ key: urlKey, range: urlRange });
  const range = draft.key === urlKey ? draft.range : urlRange;
  const activeCount = countActiveFilters(params);

  function toggleCategory(slug: string, checked: boolean) {
    update({
      category: checked
        ? [...params.category, slug]
        : params.category.filter((entry) => entry !== slug),
    });
  }

  function commitRange([min, max]: number[]) {
    if (min === undefined || max === undefined) return;
    update({
      min: min > bounds.min ? min : undefined,
      max: max < bounds.max ? max : undefined,
    });
  }

  return (
    <div
      className={cn("space-y-7", isPending && "opacity-70", className)}
      aria-busy={isPending}
    >
      {showCategories ? (
        <fieldset className="space-y-1">
          <legend className="mb-2 text-sm font-semibold">{t("catalog.category")}</legend>
          {categories.map((category) => {
            const inputId = `${id}-${category.slug}`;
            return (
              <div key={category.slug} className="flex min-h-11 items-center gap-3">
                <Checkbox
                  id={inputId}
                  checked={params.category.includes(category.slug)}
                  onCheckedChange={(checked) =>
                    toggleCategory(category.slug, checked === true)
                  }
                />
                <label htmlFor={inputId} className="flex flex-1 cursor-pointer items-center justify-between gap-2 self-stretch text-sm">
                  <span>{category.name}</span>
                  <span className="text-muted-foreground">
                    {formatNumber(category.count, locale)}
                  </span>
                </label>
              </div>
            );
          })}
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="mb-4 text-sm font-semibold">{t("catalog.priceRange")}</legend>
        <Slider
          min={bounds.min}
          max={bounds.max}
          step={bounds.step}
          minStepsBetweenThumbs={1}
          value={range}
          onValueChange={(value) => {
            const [min, max] = value;
            if (min !== undefined && max !== undefined) {
              setDraft({ key: urlKey, range: [min, max] });
            }
          }}
          onValueCommit={commitRange}
          thumbLabels={[t("catalog.priceMin"), t("catalog.priceMax")]}
          className="py-2 [&_[data-slot=slider-thumb]]:size-4"
        />
        <div className="mt-3 flex justify-between gap-2 text-xs text-muted-foreground">
          <span>{formatPrice(range[0], locale, t("common.toman"))}</span>
          <span>{formatPrice(range[1], locale, t("common.toman"))}</span>
        </div>
      </fieldset>

      <div className="flex min-h-11 items-center gap-3">
        <Checkbox
          id={`${id}-stock`}
          checked={params.stock === "1"}
          onCheckedChange={(checked) =>
            update({ stock: checked === true ? "1" : undefined })
          }
        />
        <label htmlFor={`${id}-stock`} className="flex flex-1 cursor-pointer items-center self-stretch text-sm">
          {t("catalog.inStockOnly")}
        </label>
      </div>

      {activeCount > 0 || params.q ? (
        <Button variant="outline" size="lg" className="w-full rounded-full" onClick={clear}>
          {t("catalog.clearFilters")}
        </Button>
      ) : null}
    </div>
  );
}
