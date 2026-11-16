"use client";

import { useState } from "react";
import { TagIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Link } from "@/i18n/navigation";
import { lineUnitPrice, qualifiesForWholesale, type CartProduct } from "@/lib/cart";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PurchasePanel({ product }: { product: CartProduct }) {
  const t = useTranslations();
  const locale = useLocale();
  const [quantity, setQuantity] = useState(1);
  const toman = t("common.toman");
  const name = product.name[locale];
  const { stock, wholesalePrice, minWholesaleQty } = product;
  const outOfStock = stock <= 0;
  const hasWholesale =
    wholesalePrice !== null &&
    minWholesaleQty !== null &&
    wholesalePrice < product.unitPrice &&
    minWholesaleQty <= stock;
  const qualifies = qualifiesForWholesale(product, quantity);
  const unit = lineUnitPrice(product, quantity);

  return (
    <div className="space-y-5">
      {outOfStock ? (
        <p role="status" className="rounded-2xl bg-muted px-4 py-3 text-sm font-medium">
          {t("product.outOfStockLong")}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <QuantityStepper
            value={quantity}
            max={stock}
            label={t("cart.quantityOf", { name })}
            onChange={setQuantity}
          />
          <div className="text-sm">
            <p
              className={cn(
                stock <= 10 ? "font-medium text-primary" : "text-leaf-ink",
              )}
            >
              {stock <= 10
                ? t("product.lowStock", { count: stock, formatted: formatNumber(stock, locale) })
                : t("product.inStock")}
            </p>
            {quantity > 1 ? (
              <p className="text-muted-foreground" aria-live="polite">
                {t("product.lineTotal", { total: formatPrice(unit * quantity, locale, toman) })}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <AddToCartButton
          product={product}
          quantity={quantity}
          className="flex-1 sm:min-w-56 sm:flex-none"
        />
        <WishlistButton
          productId={product.productId}
          productName={name}
          className="size-12 border border-input shadow-none"
        />
      </div>

      {hasWholesale ? (
        <div
          className={cn(
            "flex gap-3 rounded-2xl border p-4 text-sm leading-6 transition-colors",
            qualifies ? "border-brand-leaf/40 bg-brand-leaf/10" : "border-border bg-muted/60",
          )}
        >
          <TagIcon className="mt-1 size-4 shrink-0 text-gold-ink" aria-hidden="true" />
          <div>
            <p className="font-medium">
              {t("product.wholesaleHint", {
                min: formatNumber(minWholesaleQty, locale),
                price: formatPrice(wholesalePrice, locale, toman),
              })}
            </p>
            <p
              aria-live="polite"
              className={qualifies ? "font-medium text-leaf-ink" : "text-muted-foreground"}
            >
              {qualifies
                ? t("product.wholesaleReached")
                : t("product.wholesaleNote", {
                    more: formatNumber(minWholesaleQty - quantity, locale),
                  })}
            </p>
            <Link
              href="/wholesale"
              className="touch-target font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("product.wholesaleCta")}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
