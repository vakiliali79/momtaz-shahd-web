import type { Metadata } from "next";
import { Suspense } from "react";
import { HeartIcon, MapPinIcon, PackageIcon, ShoppingBagIcon, StarIcon, UserCogIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AccountHeading, AccountPageSkeleton, OrderStatusBadge } from "@/components/account/account-ui";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getDashboard } from "@/lib/account/queries";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { currentLocale } from "@/lib/locale";
import { getCity, getProvince } from "@/lib/locations";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountPages.dashboard");
  return { title: t("title") };
}

async function Dashboard() {
  const locale = await currentLocale();
  const user = await requireUser(locale, "/account");
  const [t, data] = await Promise.all([getTranslations(), getDashboard(user.id)]);
  const address = data.defaultAddress;
  const province = address ? getProvince(address.province) : undefined;
  const city = address ? getCity(address.province, address.city) : undefined;

  const quickLinks = [
    { key: "orders", href: "/account/orders", Icon: PackageIcon },
    { key: "addresses", href: "/account/addresses", Icon: MapPinIcon },
    { key: "wishlist", href: "/account/wishlist", Icon: HeartIcon },
    { key: "reviews", href: "/account/reviews", Icon: StarIcon },
    { key: "profile", href: "/account/profile", Icon: UserCogIcon },
    { key: "shop", href: "/products", Icon: ShoppingBagIcon },
  ] as const;

  return (
    <>
      <AccountHeading
        title={t("accountPages.dashboard.welcome", { name: user.name ?? "" })}
        description={t("accountPages.dashboard.description")}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <section aria-labelledby="dash-orders" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 id="dash-orders" className="text-sm text-muted-foreground">{t("accountPages.dashboard.orderCount")}</h2>
          <p className="mt-1 text-3xl font-bold">{formatNumber(data.orderCount, locale)}</p>
          <Link href="/account/orders" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            {t("accountPages.dashboard.viewOrders")}
          </Link>
        </section>

        <section aria-labelledby="dash-last" className="rounded-2xl border border-border bg-card p-5 shadow-soft md:col-span-2">
          <h2 id="dash-last" className="text-sm text-muted-foreground">{t("accountPages.dashboard.lastOrder")}</h2>
          {data.lastOrder ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold" dir="ltr">{data.lastOrder.orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(data.lastOrder.createdAt, locale)} · {formatPrice(data.lastOrder.total, locale, t("common.toman"))}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={data.lastOrder.status} />
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href={`/account/orders/${data.lastOrder.orderNumber}`}>{t("accountPages.dashboard.details")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("accountPages.dashboard.noOrders")}{" "}
              <Link href="/products" className="font-medium text-primary hover:underline">{t("accountPages.dashboard.startShopping")}</Link>
            </p>
          )}
        </section>

        <section aria-labelledby="dash-address" className="rounded-2xl border border-border bg-card p-5 shadow-soft md:col-span-2">
          <h2 id="dash-address" className="text-sm text-muted-foreground">{t("accountPages.dashboard.defaultAddress")}</h2>
          {address ? (
            <div className="mt-2 space-y-1 text-sm">
              <p className="font-semibold">{address.title}</p>
              <p className="text-muted-foreground">
                {t("address.place", { province: province?.name[locale] ?? "", city: city?.name[locale] ?? "" })} — {address.fullAddress}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t("accountPages.dashboard.noAddress")}</p>
          )}
          <Link href="/account/addresses" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            {t("accountPages.dashboard.manageAddresses")}
          </Link>
        </section>

        <section aria-labelledby="dash-wishlist" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 id="dash-wishlist" className="text-sm text-muted-foreground">{t("accountPages.dashboard.wishlistCount")}</h2>
          <p className="mt-1 text-3xl font-bold">{formatNumber(data.wishlistCount, locale)}</p>
          <Link href="/account/wishlist" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            {t("accountPages.dashboard.viewWishlist")}
          </Link>
        </section>
      </div>

      <section aria-labelledby="dash-links" className="mt-8">
        <h2 id="dash-links" className="mb-3 font-semibold">{t("accountPages.dashboard.quickLinks")}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickLinks.map(({ key, href, Icon }) => (
            <li key={key}>
              <Link
                href={href}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-brand-gold/60 hover:bg-muted/50"
              >
                <Icon className="size-5 text-brand-gold" aria-hidden="true" />
                {t(`accountPages.dashboard.links.${key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default function AccountDashboardPage() {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
