"use client";

import { useCallback, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { getCartProducts } from "@/actions/cart";
import type { CartItem } from "@/lib/cart";
import { useCartHydrated, useCartStore } from "@/stores/cart";

/** Quantity changes and removal (with an undo toast) for cart line items. */
export function useCartItemActions() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const restoreItem = useCartStore((state) => state.restoreItem);

  return {
    setQuantity: (item: CartItem, quantity: number) =>
      updateQuantity(item.productId, quantity),
    remove: (item: CartItem) => {
      const removed = removeItem(item.productId);
      if (!removed) return;
      toast(t("removed", { name: removed.name[locale] }), {
        action: { label: t("undo"), onClick: () => restoreItem(removed) },
      });
    },
  };
}

/**
 * Returns a function that refreshes the stored cart with current prices and
 * stock from the server, announcing any changes with toasts.
 */
export function useCartRefresher() {
  const t = useTranslations("cart");
  const locale = useLocale();

  return useCallback(async () => {
    const ids = useCartStore.getState().items.map((item) => item.productId);
    if (ids.length === 0) return;
    try {
      const products = await getCartProducts(ids);
      const { removed, changed } = useCartStore.getState().syncItems(products, ids);
      for (const item of removed) {
        toast.warning(t("unavailableRemoved", { name: item.name[locale] }));
      }
      if (changed) toast.info(t("synced"));
    } catch {
      // Offline or server error: keep the stored cart; checkout re-validates.
    }
  }, [t, locale]);
}

/**
 * Refreshes the cart from the server whenever `enabled` becomes true (cart
 * page and checkout mount, drawer opening).
 */
export function useCartSync(enabled: boolean) {
  const hydrated = useCartHydrated();
  const refresh = useCartRefresher();

  useEffect(() => {
    if (enabled && hydrated) void refresh();
  }, [enabled, hydrated, refresh]);
}
