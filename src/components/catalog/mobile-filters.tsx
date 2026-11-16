"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  Filters,
  type FilterCategory,
  type PriceBounds,
} from "@/components/catalog/filters";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getDirection } from "@/i18n/locales";
import { countActiveFilters, type CatalogParams } from "@/lib/catalog-query";
import { formatNumber } from "@/lib/format";

export function MobileFilters({
  params,
  categories,
  bounds,
  showCategories,
  total,
}: {
  params: CatalogParams;
  categories: readonly FilterCategory[];
  bounds: PriceBounds;
  showCategories?: boolean;
  total: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(params);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="h-10 rounded-full px-4 lg:hidden">
          <SlidersHorizontalIcon aria-hidden="true" />
          {t("catalog.filters")}
          {activeCount > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-brand-red text-[0.6875rem] font-semibold text-white">
              {formatNumber(activeCount, locale)}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent
        side={getDirection(locale) === "rtl" ? "right" : "left"}
        closeLabel={t("common.close")}
        className="w-[min(22rem,calc(100vw-2.5rem))] gap-0"
      >
        <SheetHeader>
          <SheetTitle>{t("catalog.filters")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("catalog.filtersDescription")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <Filters
            params={params}
            categories={categories}
            bounds={bounds}
            showCategories={showCategories}
          />
        </div>
        <SheetFooter className="border-t border-border">
          <Button size="lg" className="h-11 rounded-full" onClick={() => setOpen(false)}>
            {t("catalog.showResults", {
              count: total,
              formatted: formatNumber(total, locale),
            })}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
