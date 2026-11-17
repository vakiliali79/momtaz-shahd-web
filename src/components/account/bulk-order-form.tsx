"use client";

import { useState } from "react";
import { ShoppingBagIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { lineUnitPrice, qualifiesForWholesale, type CartProduct } from "@/lib/cart";
import { formatNumber, formatPrice } from "@/lib/format";
import { toLatinDigits } from "@/lib/digits";
import { useCartStore } from "@/stores/cart";

/** Quantities typed in the table; at least one line must be ordered. */
function bulkSchema(products: readonly CartProduct[]) {
  return z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(0),
      }),
    )
    .superRefine((lines, ctx) => {
      lines.forEach((line, index) => {
        const stock = products.find((product) => product.productId === line.productId)?.stock ?? 0;
        if (line.quantity > stock) ctx.addIssue({ code: "custom", path: [index], message: "overStock" });
      });
      if (!lines.some((line) => line.quantity > 0)) ctx.addIssue({ code: "custom", path: [], message: "empty" });
    });
}

/**
 * Table of products with a quantity box each; adds every line to the cart
 * in one go. Wholesale prices apply automatically from each product's
 * minimum quantity, and checkout re-checks prices and stock on the server.
 */
export function BulkOrderForm({ products }: { products: CartProduct[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<{ empty: boolean; overStock: Set<string> }>({
    empty: false,
    overStock: new Set(),
  });
  const toman = t("common.toman");

  const lines = products.map((product) => ({ productId: product.productId, quantity: quantities[product.productId] ?? 0 }));
  const total = products.reduce((sum, product) => {
    const quantity = quantities[product.productId] ?? 0;
    return sum + lineUnitPrice(product, quantity) * quantity;
  }, 0);

  function submit() {
    const parsed = bulkSchema(products).safeParse(lines);
    if (!parsed.success) {
      const overStock = new Set<string>();
      let empty = false;
      for (const issue of parsed.error.issues) {
        if (issue.message === "empty") empty = true;
        const index = issue.path[0];
        if (issue.message === "overStock" && typeof index === "number") {
          const id = lines[index]?.productId;
          if (id) overStock.add(id);
        }
      }
      setErrors({ empty, overStock });
      return;
    }
    setErrors({ empty: false, overStock: new Set() });
    let added = 0;
    for (const line of parsed.data) {
      const product = products.find((entry) => entry.productId === line.productId);
      if (product && line.quantity > 0) added += addItem(product, line.quantity).added;
    }
    toast.success(t("accountPages.wholesale.added", { formatted: formatNumber(added, locale) }));
    setQuantities({});
    router.push("/cart");
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[36rem] text-sm">
          <caption className="sr-only">{t("accountPages.wholesale.bulkTitle")}</caption>
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="p-3 text-start font-medium">{t("cart.columns.product")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("accountPages.wholesale.unitPrice")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("cart.columns.quantity")}</th>
              <th scope="col" className="p-3 text-end font-medium">{t("cart.columns.total")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const quantity = quantities[product.productId] ?? 0;
              const unit = lineUnitPrice(product, Math.max(1, quantity));
              const wholesale = qualifiesForWholesale(product, quantity);
              const over = errors.overStock.has(product.productId);
              const inputId = `bulk-${product.productId}`;
              return (
                <tr key={product.productId}>
                  <td className="p-3">
                    <label htmlFor={inputId} className="font-medium">{product.name[locale]}</label>
                    {product.minWholesaleQty ? (
                      <p className="text-xs text-muted-foreground">
                        {t("accountPages.wholesale.minQty", { formatted: formatNumber(product.minWholesaleQty, locale) })}
                      </p>
                    ) : null}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {formatPrice(unit, locale, toman)}
                    {wholesale ? (
                      <span className="ms-2 rounded-full bg-brand-leaf/15 px-2 py-0.5 text-xs font-medium text-leaf-ink">
                        {t("cart.wholesaleApplied")}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <Input
                      id={inputId}
                      inputMode="numeric"
                      value={quantity === 0 ? "" : formatNumber(quantity, locale)}
                      placeholder={formatNumber(0, locale)}
                      aria-invalid={over || undefined}
                      aria-describedby={over ? `${inputId}-error` : undefined}
                      onChange={(event) => {
                        const digits = toLatinDigits(event.target.value).replace(/\D/g, "").slice(0, 6);
                        setQuantities((current) => ({ ...current, [product.productId]: Number(digits) || 0 }));
                      }}
                      className="h-11 w-24 rounded-xl text-center tabular-nums"
                    />
                    {over ? (
                      <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-destructive">
                        {t("cart.limit", { count: product.stock, formatted: formatNumber(product.stock, locale) })}
                      </p>
                    ) : null}
                  </td>
                  <td className="p-3 text-end font-semibold whitespace-nowrap">
                    {quantity > 0 ? formatPrice(unit * quantity, locale, toman) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-bold" aria-live="polite">
          {t("cart.total")}: <span className="text-primary">{formatPrice(total, locale, toman)}</span>
        </p>
        <Button size="lg" className="h-12 rounded-full px-6 text-base" onClick={submit}>
          <ShoppingBagIcon aria-hidden="true" />
          {t("accountPages.wholesale.addAll")}
        </Button>
      </div>
      {errors.empty ? (
        <p role="alert" className="text-sm text-destructive">{t("accountPages.wholesale.emptyError")}</p>
      ) : null}
    </div>
  );
}
