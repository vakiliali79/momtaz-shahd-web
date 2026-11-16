"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";

export function AddToCartButton({
  productId,
  productName,
  unitPrice,
  stock,
  quantity = 1,
  variant = "full",
  className,
}: {
  productId: string;
  productName: string;
  unitPrice: number;
  stock: number;
  quantity?: number;
  /** "icon" is the compact quick-add used on product cards. */
  variant?: "full" | "icon";
  className?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const addItem = useCartStore((state) => state.addItem);
  const outOfStock = stock <= 0;

  function handleClick() {
    const inCart =
      useCartStore.getState().items.find((item) => item.id === productId)?.quantity ?? 0;
    if (inCart + quantity > stock) {
      toast.error(t("cart.limit", { count: stock, formatted: formatNumber(stock, locale) }));
      return;
    }
    addItem({ id: productId, unitPrice }, quantity);
    toast.success(t("cart.added", { name: productName }));
  }

  if (variant === "icon") {
    return (
      <Button
        size="icon-lg"
        disabled={outOfStock}
        aria-label={`${t("cart.add")} — ${productName}`}
        onClick={handleClick}
        className={cn("rounded-full", className)}
      >
        <ShoppingBagIcon aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      disabled={outOfStock}
      onClick={handleClick}
      className={cn("h-12 rounded-full px-6 text-base", className)}
    >
      <ShoppingBagIcon aria-hidden="true" />
      {outOfStock ? t("product.outOfStock") : t("cart.add")}
    </Button>
  );
}
