"use client";

import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";

import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import type { Direction } from "@/i18n/locales";
import { CART_STORAGE_KEY, useCartStore } from "@/stores/cart";
import { WISHLIST_STORAGE_KEY, useWishlistStore } from "@/stores/wishlist";

/**
 * Loads the persisted cart and wishlist from localStorage after mount, and
 * keeps them in sync when they change in another tab.
 */
function StoreHydration() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useWishlistStore.persist.rehydrate();

    function onStorage(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY) void useCartStore.persist.rehydrate();
      if (event.key === WISHLIST_STORAGE_KEY) void useWishlistStore.persist.rehydrate();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}

export function Providers({
  dir,
  children,
}: {
  dir: Direction;
  children: ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      // React warns about <script> tags rendered on the client. The theme
      // script only needs to run from the server HTML, so mark it inert there.
      scriptProps={{
        type: typeof window === "undefined" ? "text/javascript" : "text/plain",
      }}
    >
      <DirectionProvider dir={dir}>
        <StoreHydration />
        {/* Honour the visitor's "reduce motion" setting for all animations. */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
        <Toaster dir={dir} position="bottom-center" />
      </DirectionProvider>
    </ThemeProvider>
  );
}
