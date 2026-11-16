"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon, TagIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Link } from "@/i18n/navigation";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const stepButton =
  "grid size-11 place-items-center rounded-full text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40";

export function PurchasePanel({
  productId,
  productName,
  unitPrice,
  stock,
  wholesalePrice,
  minWholesaleQty,
}: {
  productId: string;
  productName: string;
  unitPrice: number;
  stock: number;
  wholesalePrice: number | null;
  minWholesaleQty: number | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [quantity, setQuantity] = useState(1);
  const outOfStock = stock <= 0;
  const max = Math.max(1, stock);
  const clamp = (value: number) => Math.min(max, Math.max(1, Math.round(value) || 1));
  const hasWholesale = wholesalePrice !== null && minWholesaleQty !== null;
  const qualifies = hasWholesale && quantity >= minWholesaleQty;

  return (
    <div className="space-y-5">
      {outOfStock ? (
        <p role="status" className="rounded-2xl bg-muted px-4 py-3 text-sm font-medium">
          {t("product.outOfStockLong")}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <div
            role="group"
            aria-label={t("product.quantity")}
            className="inline-flex items-center rounded-full border border-input bg-background p-0.5"
          >
            <button
              type="button"
              aria-label={t("product.decrease")}
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => clamp(value - 1))}
              className={stepButton}
            >
              <MinusIcon className="size-4" aria-hidden="true" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              aria-label={t("product.quantity")}
              value={formatNumber(quantity, locale)}
              onChange={(event) => {
                const digits = event.target.value
                  .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
                  .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
                  .replace(/\D/g, "");
                setQuantity(clamp(Number(digits)));
              }}
              className="w-12 bg-transparent text-center text-base font-semibold outline-none"
            />
            <button
              type="button"
              aria-label={t("product.increase")}
              disabled={quantity >= max}
              onClick={() => setQuantity((value) => clamp(value + 1))}
              className={stepButton}
            >
              <PlusIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
          <p
            className={cn(
              "text-sm",
              stock <= 10 ? "font-medium text-primary" : "text-brand-leaf dark:text-success",
            )}
          >
            {stock <= 10
              ? t("product.lowStock", { count: stock, formatted: formatNumber(stock, locale) })
              : t("product.inStock")}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <AddToCartButton
          productId={productId}
          productName={productName}
          unitPrice={unitPrice}
          stock={stock}
          quantity={quantity}
          className="flex-1 sm:flex-none sm:min-w-56"
        />
        <WishlistButton
          productId={productId}
          productName={productName}
          className="size-12 border border-input shadow-none"
        />
      </div>

      {hasWholesale ? (
        <div
          role="status"
          className={cn(
            "flex gap-3 rounded-2xl border p-4 text-sm leading-6 transition-colors",
            qualifies
              ? "border-brand-leaf/40 bg-brand-leaf/10"
              : "border-border bg-muted/60",
          )}
        >
          <TagIcon className="mt-1 size-4 shrink-0 text-brand-gold" aria-hidden="true" />
          <div>
            <p className="font-medium">
              {t("product.wholesaleHint", {
                min: formatNumber(minWholesaleQty, locale),
                price: formatPrice(wholesalePrice, locale, t("common.toman")),
              })}
            </p>
            <p className="text-muted-foreground">
              {qualifies ? t("product.wholesaleReached") : t("product.wholesaleNote")}{" "}
              <Link
                href="/wholesale"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("product.wholesaleCta")}
              </Link>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
