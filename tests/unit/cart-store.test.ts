import { beforeEach, describe, expect, test } from "vitest";

import type { CartProduct } from "@/lib/cart";

// The store persists to localStorage; give Node an in-memory one before the
// store module is loaded (it picks its storage when created).
const memory = new Map<string, string>();
globalThis.localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, String(value)),
    removeItem: (key) => void memory.delete(key),
    clear: () => memory.clear(),
    key: (index) => [...memory.keys()][index] ?? null,
  get length() {
    return memory.size;
  },
};

const { CART_STORAGE_KEY, selectCartCount, useCartStore } = await import("@/stores/cart");

const product = (id: string, overrides: Partial<CartProduct> = {}): CartProduct => ({
  productId: id,
  slug: id,
  name: { fa: id, en: id, ar: id },
  image: "/products/placeholder.svg",
  unitPrice: 100_000,
  wholesalePrice: null,
  minWholesaleQty: null,
  weightGrams: 450,
  stock: 10,
  ...overrides,
});

const store = () => useCartStore.getState();

beforeEach(() => {
  store().clearCart();
  memory.clear();
});

describe("cart store", () => {
  test("adds products and merges repeat adds into one line", () => {
    expect(store().addItem(product("a"), 2)).toEqual({ added: 2, quantity: 2 });
    expect(store().addItem(product("a"), 3)).toEqual({ added: 3, quantity: 5 });
    store().addItem(product("b"));
    expect(store().items.map((item) => [item.productId, item.quantity])).toEqual([["a", 5], ["b", 1]]);
    expect(selectCartCount(store())).toBe(6);
  });

  test("never adds more than the stock", () => {
    expect(store().addItem(product("a", { stock: 3 }), 5)).toEqual({ added: 3, quantity: 3 });
    expect(store().addItem(product("a", { stock: 3 }), 1)).toEqual({ added: 0, quantity: 3 });
    expect(store().addItem(product("sold-out", { stock: 0 }))).toEqual({ added: 0, quantity: 0 });
    expect(store().items).toHaveLength(1);
  });

  test("updateQuantity clamps between 1 and the stock", () => {
    store().addItem(product("a", { stock: 4 }), 2);
    store().updateQuantity("a", 99);
    expect(store().items[0]?.quantity).toBe(4);
    store().updateQuantity("a", 0);
    expect(store().items[0]?.quantity).toBe(1);
    store().updateQuantity("a", 2.7);
    expect(store().items[0]?.quantity).toBe(2);
  });

  test("removeItem returns the line so it can be restored (undo)", () => {
    store().addItem(product("a"), 2);
    const removed = store().removeItem("a");
    expect(store().items).toHaveLength(0);
    expect(removed?.quantity).toBe(2);
    if (removed) store().restoreItem(removed);
    store().restoreItem(removed ?? store().items[0]!);
    expect(store().items).toHaveLength(1);
  });

  test("applies and removes a coupon; clearCart drops both", () => {
    store().addItem(product("a"));
    store().applyCoupon({ code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 0 });
    expect(store().coupon?.code).toBe("WELCOME10");
    store().removeCoupon();
    expect(store().coupon).toBeNull();
    store().applyCoupon({ code: "X", type: "FIXED", value: 1, minOrder: 0 });
    store().clearCart();
    expect(store()).toMatchObject({ items: [], coupon: null });
  });

  test("syncItems refreshes prices, caps to new stock and drops sold-out products", () => {
    store().addItem(product("a"), 5);
    store().addItem(product("b"), 1);
    store().addItem(product("c"), 1);
    const result = store().syncItems(
      [product("a", { stock: 2, unitPrice: 120_000 }), product("b", { stock: 0 })],
      ["a", "b", "c"],
    );
    expect(result.removed.map((item) => item.productId).sort()).toEqual(["b", "c"]);
    expect(result.changed).toBe(true);
    expect(store().items).toEqual([expect.objectContaining({ productId: "a", quantity: 2, unitPrice: 120_000, maxStock: 2 })]);
  });

  test("items added while a sync was in flight are left alone", () => {
    store().addItem(product("a"));
    store().addItem(product("late"));
    store().syncItems([product("a")], ["a"]);
    expect(store().items.map((item) => item.productId)).toEqual(["a", "late"]);
  });

  test("persists only items and coupon", () => {
    store().addItem(product("a"), 2);
    const saved = JSON.parse(memory.get(CART_STORAGE_KEY) ?? "{}");
    expect(Object.keys(saved.state).sort()).toEqual(["coupon", "items"]);
    expect(saved.state.items[0]).toMatchObject({ productId: "a", quantity: 2 });
  });
});
