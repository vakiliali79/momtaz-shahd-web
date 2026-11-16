"use client";

import { ArrowRightIcon, ShoppingBagIcon, Trash2Icon, TruckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { CouponForm } from "@/components/cart/coupon-form";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCartItemActions, useCartSync } from "@/components/cart/use-cart";
import { Container } from "@/components/layout/container";
import { ProductImage } from "@/components/product/product-image";
import { ApproxPrice } from "@/components/currency/approx-price";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import {
  computeCartTotals,
  lineUnitPrice,
  qualifiesForWholesale,
  type CartItem,
  type CartTotals,
} from "@/lib/cart";
import { formatNumber, formatPrice } from "@/lib/format";
import type { ShippingConfig } from "@/lib/shipping";
import { cn } from "@/lib/utils";
import { useCartHydrated, useCartStore } from "@/stores/cart";

function useLineInfo() {
  const t = useTranslations();
  const locale = useLocale();
  const toman = t("common.toman");

  return (item: CartItem) => {
    const name = item.name[locale];
    const unit = lineUnitPrice(item, item.quantity);
    const wholesale = qualifiesForWholesale(item, item.quantity);
    const more =
      !wholesale && item.minWholesaleQty !== null && item.wholesalePrice !== null &&
      item.wholesalePrice < item.unitPrice && item.minWholesaleQty <= item.maxStock
        ? item.minWholesaleQty - item.quantity
        : null;
    return {
      name,
      unitLabel: formatPrice(unit, locale, toman),
      retailLabel: wholesale ? formatPrice(item.unitPrice, locale, toman) : null,
      lineLabel: formatPrice(unit * item.quantity, locale, toman),
      wholesale,
      hint:
        more !== null && item.wholesalePrice !== null
          ? t("cart.wholesaleHint", {
              more: formatNumber(more, locale),
              price: formatPrice(item.wholesalePrice, locale, toman),
            })
          : null,
    };
  };
}

function WholesaleBadge() {
  const t = useTranslations("cart");
  return (
    <span className="rounded-full bg-brand-leaf/15 px-2 py-0.5 text-xs font-medium text-brand-leaf dark:text-success">
      {t("wholesaleApplied")}
    </span>
  );
}

function ItemThumb({ item, className }: { item: CartItem; className?: string }) {
  return (
    <Link
      href={`/products/${item.slug}`}
      tabIndex={-1}
      aria-hidden="true"
      className={cn("relative shrink-0 overflow-hidden rounded-xl bg-secondary", className)}
    >
      <ProductImage src={item.image} alt="" sizes="96px" />
    </Link>
  );
}

function RemoveButton({ item, name }: { item: CartItem; name: string }) {
  const t = useTranslations("cart");
  const { remove } = useCartItemActions();
  return (
    <button
      type="button"
      aria-label={t("remove", { name })}
      onClick={() => remove(item)}
      className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-destructive"
    >
      <Trash2Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

function CartItems({ items }: { items: readonly CartItem[] }) {
  const t = useTranslations("cart");
  const { setQuantity } = useCartItemActions();
  const lineInfo = useLineInfo();

  return (
    <>
      {/* Table on tablets and up. */}
      <table className="hidden w-full text-sm md:table">
        <caption className="sr-only">{t("title")}</caption>
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th scope="col" className="pb-3 text-start font-medium">{t("columns.product")}</th>
            <th scope="col" className="pb-3 text-start font-medium">{t("columns.price")}</th>
            <th scope="col" className="pb-3 text-start font-medium">{t("columns.quantity")}</th>
            <th scope="col" className="pb-3 text-end font-medium">{t("columns.total")}</th>
            <th scope="col" className="pb-3"><span className="sr-only">{t("columns.actions")}</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => {
            const info = lineInfo(item);
            return (
              <tr key={item.productId} className="align-middle">
                <td className="py-4 pe-4">
                  <div className="flex items-center gap-4">
                    <ItemThumb item={item} className="size-20" />
                    <div className="min-w-0 space-y-1">
                      <Link href={`/products/${item.slug}`} className="rounded font-medium hover:text-primary">
                        {info.name}
                      </Link>
                      {info.hint ? <p className="text-xs text-muted-foreground">{info.hint}</p> : null}
                    </div>
                  </div>
                </td>
                <td className="py-4 pe-4 whitespace-nowrap">
                  <div className="space-y-1">
                    {info.retailLabel ? (
                      <s className="block text-xs text-muted-foreground">{info.retailLabel}</s>
                    ) : null}
                    <span>{info.unitLabel}</span>
                    {info.wholesale ? <div><WholesaleBadge /></div> : null}
                  </div>
                </td>
                <td className="py-4 pe-4">
                  <QuantityStepper
                    size="sm"
                    value={item.quantity}
                    max={item.maxStock}
                    label={t("quantityOf", { name: info.name })}
                    onChange={(quantity) => setQuantity(item, quantity)}
                  />
                  {item.quantity >= item.maxStock ? (
                    <p className="mt-1 text-xs text-muted-foreground">{t("maxReached")}</p>
                  ) : null}
                </td>
                <td className="py-4 text-end font-semibold whitespace-nowrap">{info.lineLabel}</td>
                <td className="py-4 ps-2 text-end">
                  <RemoveButton item={item} name={info.name} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Cards on phones. */}
      <ul className="space-y-3 md:hidden">
        {items.map((item) => {
          const info = lineInfo(item);
          return (
            <li key={item.productId} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
              <div className="flex gap-3">
                <ItemThumb item={item} className="size-20" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <Link
                      href={`/products/${item.slug}`}
                      className="line-clamp-2 rounded text-sm font-medium hover:text-primary"
                    >
                      {info.name}
                    </Link>
                    <RemoveButton item={item} name={info.name} />
                  </div>
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {info.retailLabel ? <s>{info.retailLabel}</s> : null}
                    <span>{t("each", { price: info.unitLabel })}</span>
                    {info.wholesale ? <WholesaleBadge /> : null}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <QuantityStepper
                  size="sm"
                  value={item.quantity}
                  max={item.maxStock}
                  label={t("quantityOf", { name: info.name })}
                  onChange={(quantity) => setQuantity(item, quantity)}
                />
                <span className="font-semibold">{info.lineLabel}</span>
              </div>
              {item.quantity >= item.maxStock ? (
                <p className="mt-1 text-xs text-muted-foreground">{t("maxReached")}</p>
              ) : null}
              {info.hint ? <p className="mt-2 text-xs text-muted-foreground">{info.hint}</p> : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function SummaryRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-between gap-3", className)}>
      <dt>{label}</dt>
      <dd className="text-end font-medium">{value}</dd>
    </div>
  );
}

function OrderSummary({ totals, hasItems }: { totals: CartTotals; hasItems: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const coupon = useCartStore((state) => state.coupon);
  const toman = t("common.toman");
  const price = (amount: number) => formatPrice(amount, locale, toman);
  const threshold =
    totals.freeShippingShortfall !== null
      ? totals.subtotal - totals.discount + totals.freeShippingShortfall
      : null;

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24">
      <h2 id="cart-summary" className="text-lg font-bold">
        {t("cart.summary")}
      </h2>

      <CouponForm subtotal={totals.subtotal} />

      <dl className="space-y-3 text-sm">
        <SummaryRow
          label={t("cart.subtotalItems", { formatted: formatNumber(totals.itemCount, locale) })}
          value={price(totals.retailSubtotal)}
        />
        {totals.wholesaleSavings > 0 ? (
          <SummaryRow
            label={t("cart.wholesaleSavings")}
            value={`−${price(totals.wholesaleSavings)}`}
            className="text-brand-leaf dark:text-success"
          />
        ) : null}
        {coupon ? (
          <div className="space-y-1">
            <SummaryRow
              label={t("cart.discount", { code: coupon.code })}
              value={totals.couponApplies ? `−${price(totals.discount)}` : price(0)}
              className={totals.couponApplies ? "text-brand-leaf dark:text-success" : undefined}
            />
            {!totals.couponApplies && totals.couponShortfall > 0 ? (
              <p className="text-xs text-primary">
                {t("cart.coupon.belowMin", { amount: price(totals.couponShortfall), code: coupon.code })}
              </p>
            ) : null}
          </div>
        ) : null}
        <SummaryRow
          label={t("cart.shipping")}
          value={
            totals.shipping === null
              ? t("cart.shippingUnknown")
              : totals.shipping === 0
                ? t("cart.shippingFree")
                : price(totals.shipping)
          }
        />
      </dl>

      {threshold !== null && totals.freeShippingShortfall !== null ? (
        <div className="space-y-2 rounded-xl bg-muted/70 p-3">
          <p className="flex items-center gap-2 text-xs">
            <TruckIcon className="size-4 shrink-0 text-brand-gold" aria-hidden="true" />
            {t("cart.freeShippingHint", { amount: price(totals.freeShippingShortfall) })}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
            <div
              className="h-full rounded-full bg-brand-leaf transition-[width] duration-500"
              style={{ width: `${Math.min(100, ((threshold - totals.freeShippingShortfall) / threshold) * 100)}%` }}
            />
          </div>
        </div>
      ) : totals.shipping === 0 ? (
        <p className="flex items-center gap-2 text-xs text-brand-leaf dark:text-success">
          <TruckIcon className="size-4 shrink-0" aria-hidden="true" />
          {t("cart.freeShippingReached")}
        </p>
      ) : null}

      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
        <span className="font-semibold">{t("cart.total")}</span>
        <span className="text-end text-xl font-bold text-primary" aria-live="polite">
          {price(totals.total)}
          <ApproxPrice amount={totals.total} />
        </span>
      </div>

      <Button
        asChild
        size="lg"
        className={cn("h-12 w-full rounded-full text-base", !hasItems && "pointer-events-none opacity-50")}
      >
        <Link href="/checkout" aria-disabled={!hasItems}>
          {t("cart.checkout")}
        </Link>
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("cart.checkoutNote")}</p>
    </div>
  );
}

export function CartView({ shipping }: { shipping: ShippingConfig }) {
  const t = useTranslations("cart");
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);
  const coupon = useCartStore((state) => state.coupon);
  useCartSync(true);

  if (!hydrated) {
    return (
      <Container
        className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:py-12"
        aria-busy="true"
        aria-label={t("loading")}
      >
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-md place-items-center gap-3 rounded-3xl border border-dashed border-input px-6 py-14 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-secondary text-brand-gold">
            <ShoppingBagIcon className="size-9" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h2 className="text-fluid-lg font-bold">{t("empty.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("empty.text")}</p>
          <Button asChild size="lg" className="mt-2 h-11 rounded-full px-6">
            <Link href="/products">{t("empty.cta")}</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const totals = computeCartTotals(items, coupon, { config: shipping, method: null, destination: null });

  function clearAll() {
    const snapshot = useCartStore.getState();
    const previous = { items: snapshot.items, coupon: snapshot.coupon };
    snapshot.clearCart();
    toast(t("cleared"), {
      action: { label: t("undo"), onClick: () => useCartStore.setState(previous) },
    });
  }

  return (
    <Container className="grid items-start gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10 lg:py-12">
      <section aria-label={t("title")} className="min-w-0">
        <CartItems items={items} />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="lg" className="h-10 rounded-full px-4">
            <Link href="/products">
              <ArrowRightIcon className="ltr:rotate-180" aria-hidden="true" />
              {t("continueShopping")}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={clearAll}
            className="h-10 rounded-full px-4 text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon aria-hidden="true" />
            {t("clear")}
          </Button>
        </div>
      </section>
      <aside aria-labelledby="cart-summary">
        <OrderSummary totals={totals} hasItems={items.length > 0} />
      </aside>
    </Container>
  );
}
