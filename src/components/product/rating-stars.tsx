import { StarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { localeMeta } from "@/i18n/locales";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  reviewCount,
  showCount = true,
  className,
}: {
  rating: number | null;
  reviewCount?: number;
  showCount?: boolean;
  className?: string;
}) {
  const t = useTranslations("product");
  const locale = useLocale();
  const value = rating ?? 0;
  const formatted = new Intl.NumberFormat(localeMeta[locale].numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

  return (
    <div className={cn("flex items-center gap-1.5 text-xs", className)}>
      <span
        role="img"
        aria-label={rating === null ? t("noReviews") : t("ratingLabel", { rating: formatted })}
        className="relative inline-flex"
      >
        <span className="flex gap-0.5 text-border" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon key={i} className="size-3.5 fill-current" />
          ))}
        </span>
        <span
          className="absolute inset-y-0 start-0 flex gap-0.5 overflow-hidden text-gold-ink"
          style={{ width: `${(value / 5) * 100}%` }}
          aria-hidden="true"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon key={i} className="size-3.5 shrink-0 fill-current" />
          ))}
        </span>
      </span>
      {showCount && reviewCount !== undefined && reviewCount > 0 ? (
        <span className="text-muted-foreground">
          {formatted}
          <span aria-hidden="true"> · </span>
          <span>{t("reviewCount", { count: reviewCount, formatted: formatNumber(reviewCount, locale) })}</span>
        </span>
      ) : null}
    </div>
  );
}
