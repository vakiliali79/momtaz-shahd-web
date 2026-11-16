import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AccountHeading, AccountPageSkeleton } from "@/components/account/account-ui";
import { WishlistGrid } from "@/components/account/wishlist-grid";
import { getWishlistProducts } from "@/lib/account/queries";
import { currentLocale } from "@/lib/locale";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountPages.wishlist");
  return { title: t("title") };
}

async function Wishlist() {
  const locale = await currentLocale();
  const user = await requireUser(locale, "/account/wishlist");
  const [t, products] = await Promise.all([
    getTranslations("accountPages.wishlist"),
    getWishlistProducts(user.id, locale),
  ]);
  return (
    <>
      <AccountHeading title={t("title")} description={t("description")} />
      <WishlistGrid products={products} />
    </>
  );
}

export default function WishlistPage() {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <Wishlist />
    </Suspense>
  );
}
