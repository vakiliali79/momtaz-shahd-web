"use client";

import { HeartIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlist";

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
  const toggle = useWishlistStore((state) => state.toggle);

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
