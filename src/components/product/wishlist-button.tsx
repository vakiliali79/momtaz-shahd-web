"use client";

import { useEffect, useRef } from "react";
import { HeartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setWishlisted, syncWishlist } from "@/actions/wishlist";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session";
import { useWishlistStore } from "@/stores/wishlist";

/**
 * Toggles a product in the wishlist: instantly in the browser, and in the
 * saved wishlist when signed in (reverted if the server refuses).
 */
export function useWishlistToggle() {
  const t = useTranslations("product");
  const toggle = useWishlistStore((state) => state.toggle);
  const signedIn = useSessionStore((state) => state.status === "user");

  return (productId: string) => {
    const on = !useWishlistStore.getState().ids.includes(productId);
    toggle(productId);
    if (!signedIn) return;
    setWishlisted(productId, on)
      .then((result) => {
        if (!result.ok) throw new Error("wishlist update refused");
      })
      .catch(() => {
        toggle(productId);
        toast.error(t("wishlistError"));
      });
  };
}

/**
 * When a user signs in, merges the browser's wishlist into their saved one
 * and shows the combined list. Rendered once in the app providers.
 */
export function WishlistSync() {
  const router = useRouter();
  const userId = useSessionStore((state) => state.user?.id ?? null);
  const status = useSessionStore((state) => state.status);
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "user" || !userId || lastSynced.current === userId) return;
    lastSynced.current = userId;
    void (async () => {
      // Make sure the browser copy is loaded before merging it.
      await useWishlistStore.persist.rehydrate();
      const local = useWishlistStore.getState().ids;
      const merged = await syncWishlist(local).catch(() => null);
      if (!merged) return;
      useWishlistStore.getState().setIds(merged, true);
      // Guest hearts were just saved to the account: refresh pages that count them.
      if (local.length > 0) router.refresh();
    })();
  }, [status, userId, router]);

  useEffect(() => {
    if (status === "guest") lastSynced.current = null;
  }, [status]);

  return null;
}

export function WishlistButton({
  productId,
  productName,
  className,
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const t = useTranslations("product");
  const active = useWishlistStore((state) => state.ids.includes(productId));
  const toggle = useWishlistToggle();

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={t(active ? "wishlistRemove" : "wishlistAdd", { name: productName })}
      onClick={() => toggle(productId)}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-soft backdrop-blur transition hover:text-primary active:scale-95",
        active && "text-primary",
        className,
      )}
    >
      <HeartIcon className={cn("size-4.5", active && "fill-current")} aria-hidden="true" />
    </button>
  );
}
