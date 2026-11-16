import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AppliedCoupon, CartItem, CartProduct } from "@/lib/cart";

export const CART_STORAGE_KEY = "momtaz-shahd-cart";

export type AddResult = {
  /** Units actually added; less than requested when capped by stock. */
  added: number;
  quantity: number;
};

export type SyncResult = {
  /** Items dropped because the product is gone or sold out. */
  removed: CartItem[];
  /** True when a price or quantity changed. */
  changed: boolean;
};

type CartState = {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  addItem: (product: CartProduct, quantity?: number) => AddResult;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => CartItem | undefined;
  /** Puts back an item removed a moment ago (undo). */
  restoreItem: (item: CartItem) => void;
  clearCart: () => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  /** Refreshes items from the server's current product data. */
  syncItems: (products: readonly CartProduct[], requestedIds: readonly string[]) => SyncResult;
};

function toItem(product: CartProduct, quantity: number): CartItem {
  const { stock, ...rest } = product;
  return { ...rest, maxStock: Math.max(0, stock), quantity };
}

function clampQuantity(quantity: number, maxStock: number): number {
  return Math.min(Math.max(0, maxStock), Math.max(1, Math.floor(quantity) || 1));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (product, quantity = 1) => {
        const existing = get().items.find((item) => item.productId === product.productId);
        const current = existing?.quantity ?? 0;
        const requested = Math.max(1, Math.floor(quantity) || 1);
        const next = Math.min(Math.max(0, product.stock), current + requested);
        const added = next - current;
        if (added <= 0) return { added: 0, quantity: current };

        const item = toItem(product, next);
        set((state) => ({
          items: existing
            ? state.items.map((entry) => (entry.productId === product.productId ? item : entry))
            : [...state.items, item],
        }));
        return { added, quantity: next };
      },

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: clampQuantity(quantity, item.maxStock) }
              : item,
          ),
        })),

      removeItem: (productId) => {
        const removed = get().items.find((item) => item.productId === productId);
        if (removed) {
          set((state) => ({
            items: state.items.filter((item) => item.productId !== productId),
          }));
        }
        return removed;
      },

      restoreItem: (item) =>
        set((state) =>
          state.items.some((entry) => entry.productId === item.productId)
            ? state
            : { items: [...state.items, item] },
        ),

      clearCart: () => set({ items: [], coupon: null }),
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      syncItems: (products, requestedIds) => {
        const byId = new Map(products.map((product) => [product.productId, product]));
        const requested = new Set(requestedIds);
        const removed: CartItem[] = [];
        let changed = false;

        const items = get().items.flatMap((item) => {
          // Items added while the request was in flight are left alone.
          if (!requested.has(item.productId)) return [item];
          const product = byId.get(item.productId);
          if (!product || product.stock <= 0) {
            removed.push(item);
            return [];
          }
          const quantity = Math.min(item.quantity, product.stock);
          if (
            quantity !== item.quantity ||
            product.unitPrice !== item.unitPrice ||
            product.wholesalePrice !== item.wholesalePrice ||
            product.minWholesaleQty !== item.minWholesaleQty
          ) {
            changed = true;
          }
          return [toItem(product, quantity)];
        });

        set({ items });
        return { removed, changed };
      },
    }),
    {
      name: CART_STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
      // Version 1 items lacked names, images and prices; they cannot be
      // rebuilt reliably, so an old cart starts empty.
      migrate: () => ({ items: [], coupon: null }),
      // Rehydrated after mount (see StoreHydration in providers.tsx) so the
      // server HTML and the first client render match. Components that show
      // cart contents wait for useCartHydrated().
      skipHydration: true,
    },
  ),
);

/** True once the persisted cart has been loaded from localStorage. */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useCartStore.persist.onFinishHydration(onChange),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
}

export const selectCartCount = (state: Pick<CartState, "items">): number =>
  state.items.reduce((total, item) => total + item.quantity, 0);
