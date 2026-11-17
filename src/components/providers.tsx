"use client";

import { useEffect, type ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";

import { WishlistSync } from "@/components/product/wishlist-button";
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

/** Motion's animation code loads after the page, keeping it out of the first download. */
const loadMotionFeatures = () => import("@/components/shared/motion-features").then((module) => module.default);

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
        <WishlistSync />
        {/* Honour the visitor's "reduce motion" setting for all animations. */}
        <LazyMotion features={loadMotionFeatures} strict>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </LazyMotion>
        <Toaster dir={dir} position="bottom-center" />
      </DirectionProvider>
    </ThemeProvider>
  );
}
