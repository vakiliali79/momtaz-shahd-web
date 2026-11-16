import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { toCatalogQuery, type CatalogParams } from "@/lib/catalog-query";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Page numbers to show: first, last, and a window around the current page. */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((p, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && p - previous > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

const itemClass =
  "grid h-11 min-w-11 place-items-center rounded-full px-3 text-sm font-medium transition-colors";

export function Pagination({
  basePath,
  params,
  page,
  pageCount,
}: {
  basePath: string;
  params: CatalogParams;
  page: number;
  pageCount: number;
}) {
  const t = useTranslations("catalog.pagination");
  const locale = useLocale();
  if (pageCount <= 1) return null;

  const href = (target: number) => ({
    pathname: basePath,
    query: toCatalogQuery({ ...params, page: target }),
  });

  return (
    <nav aria-label={t("label")} className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} aria-label={t("previous")} className={cn(itemClass, "hover:bg-muted")}>
          <ChevronRightIcon className="size-4 ltr:rotate-180" aria-hidden="true" />
        </Link>
      ) : null}
      {pageWindow(page, pageCount).map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={href(entry)}
            aria-label={t("page", { page: formatNumber(entry, locale) })}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              itemClass,
              entry === page
                ? "bg-brand-red text-white"
                : "hover:bg-muted",
            )}
          >
            {formatNumber(entry, locale)}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={href(page + 1)} aria-label={t("next")} className={cn(itemClass, "hover:bg-muted")}>
          <ChevronLeftIcon className="size-4 ltr:rotate-180" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
