import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AccountEmpty, AccountHeading, AccountPageSkeleton, OrderStatusBadge } from "@/components/account/account-ui";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listOrders } from "@/lib/account/queries";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { currentLocale } from "@/lib/locale";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountPages.orders");
  return { title: t("title") };
}

async function Orders() {
  const locale = await currentLocale();
  const user = await requireUser(locale, "/account/orders");
  const [t, orders] = await Promise.all([getTranslations(), listOrders(user.id)]);
  const price = (amount: number) => formatPrice(amount, locale, t("common.toman"));

  if (orders.length === 0) {
    return (
      <>
        <AccountHeading title={t("accountPages.orders.title")} />
        <AccountEmpty
          icon={<PackageIcon className="size-7" strokeWidth={1.5} aria-hidden="true" />}
          title={t("accountPages.orders.emptyTitle")}
          text={t("accountPages.orders.emptyText")}
          action={
            <Button asChild size="lg" className="mt-2 h-11 rounded-full px-6">
              <Link href="/products">{t("cart.empty.cta")}</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <AccountHeading title={t("accountPages.orders.title")} description={t("accountPages.orders.description")} />

      <table className="hidden w-full text-sm md:table">
        <caption className="sr-only">{t("accountPages.orders.title")}</caption>
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th scope="col" className="pb-3 text-start font-medium">{t("order.number")}</th>
            <th scope="col" className="pb-3 text-start font-medium">{t("order.date")}</th>
            <th scope="col" className="pb-3 text-start font-medium">{t("accountPages.orders.items")}</th>
            <th scope="col" className="pb-3 text-start font-medium">{t("cart.total")}</th>
            <th scope="col" className="pb-3 text-start font-medium">{t("order.statusLabel")}</th>
            <th scope="col" className="pb-3"><span className="sr-only">{t("accountPages.orders.details")}</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((order) => (
            <tr key={order.orderNumber}>
              <td className="py-4 pe-3 font-medium" dir="ltr">
                <span className="block text-start">{order.orderNumber}</span>
              </td>
              <td className="py-4 pe-3">
                <time dateTime={order.createdAt}>{formatDate(order.createdAt, locale)}</time>
              </td>
              <td className="py-4 pe-3">{formatNumber(order.itemCount, locale)}</td>
              <td className="py-4 pe-3 font-semibold whitespace-nowrap">{price(order.total)}</td>
              <td className="py-4 pe-3"><OrderStatusBadge status={order.status} /></td>
              <td className="py-4 text-end">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    aria-label={t("accountPages.orders.detailsFor", { number: order.orderNumber })}
                  >
                    {t("accountPages.orders.details")}
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="space-y-3 md:hidden">
        {orders.map((order) => (
          <li key={order.orderNumber}>
            <Link
              href={`/account/orders/${order.orderNumber}`}
              className="block rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-brand-gold/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold" dir="ltr">{order.orderNumber}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <time dateTime={order.createdAt}>{formatDate(order.createdAt, locale)}</time>
                <span className="font-semibold text-foreground">{price(order.total)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <Orders />
    </Suspense>
  );
}
