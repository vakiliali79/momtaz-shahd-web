"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";

import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import type { Direction } from "@/i18n/locales";
import { useCartStore } from "@/stores/cart";

/** Loads the persisted cart from localStorage once the app has mounted. */
function CartHydration() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
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
        <CartHydration />
        {children}
        <Toaster dir={dir} position="bottom-center" />
      </DirectionProvider>
    </ThemeProvider>
  );
}
