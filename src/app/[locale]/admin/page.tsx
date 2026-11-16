import type { Metadata } from "next";
import { Suspense } from "react";
import { BoxesIcon, CalendarRangeIcon, ClockIcon, HandshakeIcon, WalletIcon, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { OrderStatusBadge } from "@/components/account/account-ui";
import { AdminCard, AdminHeading } from "@/components/admin/admin-ui";
import { SalesChart } from "@/components/admin/dashboard/sales-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { getDashboardData } from "@/lib/admin/dashboard";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.dashboard");
  return { title: t("title") };
}

function Kpi({ Icon, label, value, href, hint }: { Icon: LucideIcon; label: string; value: string; href?: string; hint?: string }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4 text-brand-gold" aria-hidden="true" />
      </div>
      <p className="mt-2 text-xl font-bold break-words tabular-nums sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );
  const className = "block rounded-2xl border border-border bg-card p-4 shadow-soft";
  return href ? (
    <Link href={href} className={`${className} transition-colors hover:border-brand-gold`}>{body}</Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

async function Dashboard() {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin");
  const [t, tCommon, data] = await Promise.all([getTranslations("admin.dashboard"), getTranslations("common"), getDashboardData(locale)]);
  const toman = tCommon("toman");
  const { kpis } = data;
  const maxRevenue = Math.max(1, ...data.topProducts.map((product) => product.revenue));

  return (
    <>
      <AdminHeading title={t("title")} description={t("description")} />
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <Kpi Icon={WalletIcon} label={t("kpis.today")} value={formatPrice(kpis.today, locale, toman)} />
        <Kpi Icon={CalendarRangeIcon} label={t("kpis.month")} value={formatPrice(kpis.month, locale, toman)} hint={t("kpis.monthHint")} />
        <Kpi Icon={ClockIcon} label={t("kpis.pending")} value={formatNumber(kpis.pendingOrders, locale)} href="/admin/orders?status=PENDING" />
        <Kpi Icon={BoxesIcon} label={t("kpis.lowStock")} value={formatNumber(kpis.lowStock, locale)} href="/admin/products?stock=low" />
        <Kpi Icon={HandshakeIcon} label={t("kpis.wholesale")} value={formatNumber(kpis.newWholesale, locale)} href="/admin/wholesale?status=NEW" />
      </div>

      <AdminCard title={t("chartTitle")} className="mt-6">
        <SalesChart data={data.daily} />
      </AdminCard>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AdminCard title={t("topProducts")}>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noSales")}</p>
          ) : (
            <ol className="space-y-3">
              {data.topProducts.map((product) => (
                <li key={product.productId} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
                    <Link href={`/admin/products/${product.productId}`} className="font-medium hover:text-primary">{product.name}</Link>
                    <span className="shrink-0 text-muted-foreground">
                      {t("sold", { count: product.quantity, formatted: formatNumber(product.quantity, locale) })} · {formatPrice(product.revenue, locale, toman)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted" aria-hidden="true">
                    <div className="h-full rounded-full bg-chart-1" style={{ inlineSize: `${(product.revenue / maxRevenue) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </AdminCard>

        <AdminCard title={t("latestOrders")} actions={<Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">{t("allOrders")}</Link>}>
          {data.latestOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {data.latestOrders.map((order) => (
                <li key={order.orderNumber} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/admin/orders/${order.orderNumber}`} className="font-medium hover:text-primary" dir="ltr">{order.orderNumber}</Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.customer} · {formatDate(order.createdAt, locale, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold whitespace-nowrap">{formatPrice(order.total, locale, toman)}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
