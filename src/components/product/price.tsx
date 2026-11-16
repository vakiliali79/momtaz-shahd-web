import { useLocale, useTranslations } from "next-intl";

import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Price({
  price,
  discountPrice,
  size = "md",
  className,
}: {
  price: number;
  discountPrice: number | null;
  size?: "md" | "lg";
  className?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const toman = t("common.toman");

  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      {discountPrice !== null ? (
        <>
          <span className="sr-only">{t("product.originalPrice")}: </span>
          <s className={cn("text-muted-foreground", size === "lg" ? "text-base" : "text-xs")}>
            {formatPrice(price, locale)}
          </s>
          <span className="sr-only">{t("product.salePrice")}: </span>
        </>
      ) : null}
      <span
        className={cn(
          "font-bold text-primary",
          size === "lg" ? "text-fluid-2xl" : "text-base",
        )}
      >
        {formatPrice(discountPrice ?? price, locale)}
        <span className={cn("ms-1 font-medium", size === "lg" ? "text-base" : "text-xs")}>
          {toman}
        </span>
      </span>
    </p>
  );
}
