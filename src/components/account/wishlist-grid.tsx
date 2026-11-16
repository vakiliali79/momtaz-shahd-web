"use client";

import { HeartIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { AccountEmpty } from "@/components/account/account-ui";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/lib/data/catalog";
import { Link } from "@/i18n/navigation";
import { useWishlistStore } from "@/stores/wishlist";

/**
 * The saved wishlist. Once the browser list is synced with the account,
 * un-hearting a product removes its card right away.
 */
export function WishlistGrid({ products }: { products: CatalogProduct[] }) {
  const t = useTranslations();
  const synced = useWishlistStore((state) => state.synced);
  const ids = useWishlistStore((state) => state.ids);
  const visible = synced ? products.filter((product) => ids.includes(product.id)) : products;

  if (visible.length === 0) {
    return (
      <AccountEmpty
        icon={<HeartIcon className="size-7" strokeWidth={1.5} aria-hidden="true" />}
        title={t("accountPages.wishlist.emptyTitle")}
        text={t("accountPages.wishlist.emptyText")}
        action={
          <Button asChild size="lg" className="mt-2 h-11 rounded-full px-6">
            <Link href="/products">{t("cart.empty.cta")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
      {visible.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
