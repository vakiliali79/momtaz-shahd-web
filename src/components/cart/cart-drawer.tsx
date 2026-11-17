"use client";

import { useEffect } from "react";
import { ShoppingBagIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useLocale, useTranslations } from "next-intl";

import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCartItemActions, useCartSync } from "@/components/cart/use-cart";
import { ProductImage } from "@/components/product/product-image";
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
import { Skeleton } from "@/components/ui/skeleton";
import { getDirection } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { computeCartTotals, lineUnitPrice, qualifiesForWholesale } from "@/lib/cart";
import { formatNumber, formatPrice } from "@/lib/format";
import { selectCartCount, useCartHydrated, useCartStore } from "@/stores/cart";
import { useCartDrawer } from "@/stores/cart-ui";

export function CartDrawer() {
  const t = useTranslations();
  const locale = useLocale();
  const open = useCartDrawer((state) => state.open);
  const setOpen = useCartDrawer((state) => state.setOpen);
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);
  const count = useCartStore(selectCartCount);
  const { setQuantity, remove } = useCartItemActions();
  const [iconScope, animate] = useAnimate<HTMLSpanElement>();
  const totals = computeCartTotals(items, null);
  const toman = t("common.toman");
  const close = () => setOpen(false);

  useCartSync(open);

  // Bounce the bag icon whenever something is added to the cart.
  useEffect(
    () =>
      useCartStore.subscribe((state, previous) => {
        if (selectCartCount(state) > selectCartCount(previous) && iconScope.current) {
          void animate(
            iconScope.current,
            { scale: [1, 1.35, 0.9, 1], rotate: [0, -12, 8, 0] },
            { duration: 0.5 },
          );
        }
      }),
    [animate, iconScope],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="relative"
          aria-label={t("cart.labelWithCount", { count: hydrated ? count : 0 })}
        >
          <span ref={iconScope} className="inline-flex">
            <ShoppingBagIcon aria-hidden="true" />
          </span>
          <AnimatePresence initial={false}>
            {hydrated && count > 0 ? (
              <motion.span
                // A new key per count makes the badge pop each time it changes.
                key={count}
                aria-hidden="true"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 16 }}
                className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-red px-1 text-[0.6875rem] leading-none font-semibold text-white ring-2 ring-background"
              >
                {formatNumber(Math.min(count, 99), locale)}
                {count > 99 ? "+" : ""}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </Button>
      </SheetTrigger>

      <SheetContent
        // Opens from the inline-end edge: right in LTR, left in RTL.
        side={getDirection(locale) === "rtl" ? "left" : "right"}
        closeLabel={t("common.close")}
        className="w-[min(26rem,calc(100vw-2rem))] gap-0 data-[side=left]:sm:max-w-md data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pe-12">
          <SheetTitle className="text-lg font-semibold">
            {t("cart.title")}
            {hydrated && count > 0 ? (
              <span className="ms-2 text-sm font-normal text-muted-foreground">
                ({formatNumber(count, locale)})
              </span>
            ) : null}
          </SheetTitle>
          <SheetDescription className="sr-only">{t("cart.description")}</SheetDescription>
        </SheetHeader>

        {!hydrated ? (
          <div className="space-y-4 p-4" aria-busy="true" aria-label={t("cart.loading")}>
            {[0, 1].map((key) => (
              <div key={key} className="flex gap-3">
                <Skeleton className="size-20 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="grid flex-1 place-items-center p-6 text-center">
            <div className="space-y-3">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-secondary text-gold-ink">
                <ShoppingBagIcon className="size-7" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <p className="font-semibold">{t("cart.empty.title")}</p>
              <p className="text-sm text-muted-foreground">{t("cart.empty.text")}</p>
              <Button asChild size="lg" className="mt-2 h-11 rounded-full px-6">
                <Link href="/products" onClick={close}>
                  {t("cart.empty.cta")}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-4">
              {items.map((item) => {
                const name = item.name[locale];
                const unit = lineUnitPrice(item, item.quantity);
                const wholesale = qualifiesForWholesale(item, item.quantity);
                return (
                  <li key={item.productId} className="flex gap-3 py-4">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={close}
                      tabIndex={-1}
                      aria-hidden="true"
                      className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-secondary"
                    >
                      <ProductImage src={item.image} alt="" sizes="80px" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={close}
                          className="touch-target line-clamp-2 rounded text-sm font-medium hover:text-primary"
                        >
                          {name}
                        </Link>
                        <button
                          type="button"
                          aria-label={t("cart.remove", { name })}
                          onClick={() => remove(item)}
                          className="-me-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-destructive"
                        >
                          <Trash2Icon className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{t("cart.each", { price: formatPrice(unit, locale, toman) })}</span>
                        {wholesale ? (
                          <span className="rounded-full bg-brand-leaf/15 px-2 py-0.5 font-medium text-leaf-ink">
                            {t("cart.wholesaleApplied")}
                          </span>
                        ) : null}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <QuantityStepper
                          size="sm"
                          value={item.quantity}
                          max={item.maxStock}
                          label={t("cart.quantityOf", { name })}
                          onChange={(quantity) => setQuantity(item, quantity)}
                        />
                        <span className="text-sm font-semibold">
                          {formatPrice(unit * item.quantity, locale, toman)}
                        </span>
                      </div>
                      {item.quantity >= item.maxStock ? (
                        <p className="mt-1 text-xs text-muted-foreground">{t("cart.maxReached")}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            <SheetFooter className="gap-3 border-t border-border bg-muted/40">
              {totals.wholesaleSavings > 0 ? (
                <div className="flex justify-between gap-2 text-sm text-leaf-ink">
                  <span>{t("cart.wholesaleSavings")}</span>
                  <span>−{formatPrice(totals.wholesaleSavings, locale, toman)}</span>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{t("cart.subtotal")}</span>
                <span className="text-lg font-bold" aria-live="polite">
                  {formatPrice(totals.subtotal, locale, toman)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t("cart.drawerNote")}</p>
              <Button asChild size="lg" className="h-12 rounded-full text-base">
                <Link href="/checkout" onClick={close}>
                  {t("cart.checkout")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 rounded-full">
                <Link href="/cart" onClick={close}>
                  {t("cart.viewCart")}
                </Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
