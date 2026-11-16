"use client";

import { ChevronUpIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ProductImage } from "@/components/product/product-image";
import { ApproxPrice } from "@/components/currency/approx-price";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { lineUnitPrice, type AppliedCoupon, type CartItem, type CartTotals } from "@/lib/cart";
import { formatNumber, formatPrice } from "@/lib/format";

type SummaryProps = {
  items: readonly CartItem[];
  totals: CartTotals;
  coupon: AppliedCoupon | null;
  /** True once a shipping method is chosen; before that the cost is an estimate. */
  shippingChosen: boolean;
};

function SummaryBody({ items, totals, coupon, shippingChosen }: SummaryProps) {
  const t = useTranslations();
  const locale = useLocale();
  const price = (amount: number) => formatPrice(amount, locale, t("common.toman"));

  const rows: { label: string; value: string; positive?: boolean }[] = [
    {
      label: t("cart.subtotalItems", { formatted: formatNumber(totals.itemCount, locale) }),
      value: price(totals.retailSubtotal),
    },
  ];
  if (totals.wholesaleSavings > 0) {
    rows.push({ label: t("cart.wholesaleSavings"), value: `−${price(totals.wholesaleSavings)}`, positive: true });
  }
  if (coupon) {
    rows.push({
      label: t("cart.discount", { code: coupon.code }),
      value: totals.couponApplies ? `−${price(totals.discount)}` : price(0),
      positive: totals.couponApplies,
    });
  }
  rows.push({
    label: shippingChosen ? t("checkout.summary.shipping") : t("cart.shipping"),
    value:
      totals.shipping === null
        ? t("checkout.summary.shippingPending")
        : totals.shipping === 0
          ? t("cart.shippingFree")
          : price(totals.shipping),
  });

  return (
    <div className="space-y-4">
      <ul className="max-h-64 space-y-3 overflow-y-auto">
        {items.map((item) => {
          const unit = lineUnitPrice(item, item.quantity);
          return (
            <li key={item.productId} className="flex items-center gap-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                <ProductImage src={item.image} alt="" sizes="56px" />
                <span className="absolute -end-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-[0.6875rem] font-semibold text-background">
                  {formatNumber(item.quantity, locale)}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-sm font-medium">{item.name[locale]}</span>
                <span className="text-xs text-muted-foreground">{t("cart.each", { price: price(unit) })}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold">{price(unit * item.quantity)}</span>
            </li>
          );
        })}
      </ul>

      <dl className="space-y-2.5 border-t border-border pt-4 text-sm">
        {rows.map((row) => (
          <div key={row.label} className={row.positive ? "flex justify-between gap-3 text-brand-leaf dark:text-success" : "flex justify-between gap-3"}>
            <dt>{row.label}</dt>
            <dd className="text-end font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
      {coupon && !totals.couponApplies && totals.couponShortfall > 0 ? (
        <p className="text-xs text-primary">
          {t("cart.coupon.belowMin", { amount: price(totals.couponShortfall), code: coupon.code })}
        </p>
      ) : null}
      {!coupon ? (
        <p className="text-xs text-muted-foreground">
          {t("checkout.summary.couponHint")}{" "}
          <Link href="/cart" className="font-medium text-primary hover:underline">
            {t("checkout.summary.editCart")}
          </Link>
        </p>
      ) : null}

      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
        <span className="font-semibold">{t("cart.total")}</span>
        <span className="text-end text-xl font-bold text-primary" aria-live="polite">
          {price(totals.total)}
          <ApproxPrice amount={totals.total} />
        </span>
      </div>
    </div>
  );
}

/** Sticky card on desktop; a bottom bar with an expandable sheet on phones. */
export function CheckoutSummary(props: SummaryProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <>
      <aside aria-labelledby="checkout-summary-title" className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 id="checkout-summary-title" className="text-lg font-bold">
              {t("cart.summary")}
            </h2>
            <Link href="/cart" className="text-sm font-medium text-primary hover:underline">
              {t("checkout.summary.editCart")}
            </Link>
          </div>
          <SummaryBody {...props} />
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-8px_24px_rgb(0_0_0/0.08)] backdrop-blur lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-between gap-3 rounded-xl px-2 py-1.5">
              <span className="text-start">
                <span className="block text-xs text-muted-foreground">{t("checkout.summary.totalLabel")}</span>
                <span className="block text-lg font-bold text-primary">
                  {formatPrice(props.totals.total, locale, t("common.toman"))}
                </span>
              </span>
              <span className="flex items-center gap-1 text-sm font-medium">
                {t("checkout.summary.showDetails")}
                <ChevronUpIcon className="size-4" aria-hidden="true" />
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" closeLabel={t("common.close")} className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold">{t("cart.summary")}</SheetTitle>
              <SheetDescription className="sr-only">{t("checkout.summary.description")}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">
              <SummaryBody {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
