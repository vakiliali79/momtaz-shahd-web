import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountHeading, AccountPageSkeleton } from "@/components/account/account-ui";
import { BulkOrderForm } from "@/components/account/bulk-order-form";
import { Link } from "@/i18n/navigation";
import { listWholesaleRequests } from "@/lib/account/queries";
import { toCartProduct } from "@/lib/cart";
import { getCatalog } from "@/lib/data/catalog";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { currentLocale } from "@/lib/locale";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountPages.wholesale");
  return { title: t("title") };
}

const requestStyles = {
  NEW: "bg-brand-gold/15 text-gold-ink",
  CONTACTED: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  CONVERTED: "bg-brand-leaf/15 text-leaf-ink",
  REJECTED: "bg-muted text-muted-foreground",
} as const;

async function Wholesale() {
  const locale = await currentLocale();
  const user = await requireUser(locale, "/account/wholesale");
  // Only for approved wholesale accounts.
  if (user.role !== "WHOLESALE") notFound();

  const [t, catalog, requests] = await Promise.all([
    getTranslations(),
    getCatalog(locale),
    listWholesaleRequests(user.phone),
  ]);
  const products = catalog.products.filter(
    (product) => product.wholesalePrice !== null && product.minWholesaleQty !== null,
  );
  const price = (amount: number) => formatPrice(amount, locale, t("common.toman"));

  return (
    <div className="space-y-10">
      <AccountHeading title={t("accountPages.wholesale.title")} description={t("accountPages.wholesale.description")} />

      <section aria-labelledby="price-list">
        <h2 id="price-list" className="mb-3 text-lg font-semibold">{t("accountPages.wholesale.priceList")}</h2>
        <div className="relative overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">{t("accountPages.wholesale.priceList")}</caption>
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="p-3 text-start font-medium">{t("cart.columns.product")}</th>
                <th scope="col" className="p-3 text-start font-medium">{t("accountPages.wholesale.retail")}</th>
                <th scope="col" className="p-3 text-start font-medium">{t("accountPages.wholesale.wholesalePrice")}</th>
                <th scope="col" className="p-3 text-start font-medium">{t("accountPages.wholesale.minimum")}</th>
                <th scope="col" className="p-3 text-start font-medium">{t("accountPages.wholesale.availability")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="p-3">
                    <Link href={`/products/${product.slug}`} className="touch-target font-medium hover:text-primary">{product.name}</Link>
                  </td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{price(product.effectivePrice)}</td>
                  <td className="p-3 font-semibold whitespace-nowrap text-primary">{price(product.wholesalePrice ?? 0)}</td>
                  <td className="p-3">{formatNumber(product.minWholesaleQty ?? 0, locale)}</td>
                  <td className="p-3">
                    {product.stock > 0 ? t("product.inStock") : t("product.outOfStock")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="bulk-order">
        <h2 id="bulk-order" className="mb-1 text-lg font-semibold">{t("accountPages.wholesale.bulkTitle")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("accountPages.wholesale.bulkText")}</p>
        <BulkOrderForm products={products.filter((product) => product.stock > 0).map(toCartProduct)} />
      </section>

      <section aria-labelledby="wholesale-requests">
        <h2 id="wholesale-requests" className="mb-3 text-lg font-semibold">{t("accountPages.wholesale.requests")}</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("accountPages.wholesale.noRequests")}{" "}
            <Link href="/wholesale" className="touch-target font-medium text-primary hover:underline">
              {t("accountPages.wholesale.newRequest")}
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {requests.map((request) => (
              <li key={request.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{request.companyName}</p>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", requestStyles[request.status])}>
                    {t(`accountPages.wholesale.requestStatus.${request.status}`)}
                  </span>
                </div>
                <p dir="auto" className="mt-1 text-sm text-muted-foreground">{request.products}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <time dateTime={request.createdAt}>{formatDate(request.createdAt, locale)}</time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function WholesalePage() {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <Wholesale />
    </Suspense>
  );
}
