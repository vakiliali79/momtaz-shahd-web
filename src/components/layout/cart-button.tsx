"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatNumber } from "@/lib/format";
import { selectCartCount, useCartStore } from "@/stores/cart";

export function CartButton() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const count = useCartStore(selectCartCount);

  return (
    <Button asChild variant="ghost" size="icon-lg" className="relative">
      <Link href="/cart" aria-label={t("labelWithCount", { count })}>
        <ShoppingBagIcon aria-hidden="true" />
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.6875rem] leading-none font-semibold text-primary-foreground ring-2 ring-background"
          >
            {formatNumber(Math.min(count, 99), locale)}
            {count > 99 ? "+" : ""}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
