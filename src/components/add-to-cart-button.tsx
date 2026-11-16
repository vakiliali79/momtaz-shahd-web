"use client";

import { useEffect, useState } from "react";
import { CheckIcon, ShoppingBagIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { CartProduct } from "@/lib/cart";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { useCartDrawer } from "@/stores/cart-ui";

export function AddToCartButton({
  product,
  quantity = 1,
  variant = "full",
  className,
}: {
  product: CartProduct;
  quantity?: number;
  /** "icon" is the compact quick-add used on product cards. */
  variant?: "full" | "icon";
  className?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartDrawer((state) => state.setOpen);
  const [justAdded, setJustAdded] = useState(false);
  const outOfStock = product.stock <= 0;
  const name = product.name[locale];

  // Show the check mark briefly after a successful add.
  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 1600);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  function handleClick() {
    const { added } = addItem(product, quantity);
    if (added === 0) {
      toast.error(
        t("cart.limit", { count: product.stock, formatted: formatNumber(product.stock, locale) }),
      );
      return;
    }
    setJustAdded(true);
    const options = { action: { label: t("cart.view"), onClick: () => openCart(true) } };
    if (added < quantity) {
      toast.warning(
        t("cart.addedPartial", { name, formatted: formatNumber(added, locale) }),
        options,
      );
    } else {
      toast.success(t("cart.added", { name }), options);
    }
  }

  const icon = (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={justAdded ? "added" : "idle"}
        initial={{ scale: 0.3, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.3, opacity: 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 24 }}
        className="inline-flex"
        aria-hidden="true"
      >
        {justAdded ? <CheckIcon /> : <ShoppingBagIcon />}
      </motion.span>
    </AnimatePresence>
  );

  if (variant === "icon") {
    return (
      <Button
        size="icon-lg"
        disabled={outOfStock}
        aria-label={`${outOfStock ? t("product.outOfStock") : t("cart.add")} — ${name}`}
        onClick={handleClick}
        className={cn(
          "rounded-full transition-colors",
          justAdded && "bg-brand-leaf hover:bg-brand-leaf",
          className,
        )}
      >
        {icon}
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      disabled={outOfStock}
      onClick={handleClick}
      className={cn(
        "h-12 rounded-full px-6 text-base transition-colors",
        justAdded && "bg-brand-leaf hover:bg-brand-leaf",
        className,
      )}
    >
      {icon}
      {outOfStock ? t("product.outOfStock") : justAdded ? t("cart.addedShort") : t("cart.add")}
    </Button>
  );
}
