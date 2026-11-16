import type { Metadata } from "next";
import { Suspense } from "react";
import { CircleXIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { OrderPageShell, OrderPageSkeleton } from "@/app/[locale]/checkout/order-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { formatPrice } from "@/lib/format";
import { getOrderForUser } from "@/lib/orders/queries";
import { isOnlinePaymentEnabled } from "@/lib/payments";
import { requireUser } from "@/lib/session";

// Private, per-order page: there is nothing to prerender, so navigation to it
// waits for the server instead of showing a prefetched shell.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("order.failed");
  return { title: t("title"), robots: { index: false, follow: false } };
}

async function Failure({
  locale,
  params,
}: {
  locale: AppLocale;
  params: PageProps<"/[locale]/checkout/failed/[orderNumber]">["params"];
}) {
  const { orderNumber } = await params;
  const user = await requireUser(locale, `/checkout/failed/${orderNumber}`);
  const order = await getOrderForUser(orderNumber, user.id);
  if (!order) notFound();
  // Paid in the meantime, or not an online payment: nothing to retry.
  if (order.paymentMethod !== "ONLINE" || order.status !== "PENDING") {
    redirect(`/${locale}/checkout/success/${order.orderNumber}`);
  }

  const t = await getTranslations();
  return (
    <div className="space-y-6 text-center">
      <CircleXIcon className="mx-auto size-16 text-destructive" strokeWidth={1.5} aria-hidden="true" />
      <h1 className="text-fluid-2xl font-bold">{t("order.failed.title")}</h1>
      <p className="mx-auto max-w-xl text-pretty text-muted-foreground">{t("order.failed.text")}</p>
      <dl className="mx-auto grid max-w-md grid-cols-2 gap-3 rounded-2xl bg-muted/60 p-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t("order.number")}</dt>
          <dd className="font-semibold" dir="ltr">{order.orderNumber}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("order.amount")}</dt>
          <dd className="font-semibold">{formatPrice(order.total, locale, t("common.toman"))}</dd>
        </div>
      </dl>
      <p className="text-sm text-muted-foreground">{t("order.failed.reserved")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {isOnlinePaymentEnabled() ? (
          <Button asChild size="lg" className="h-12 rounded-full px-8 text-base">
            <Link href={`/checkout/pay/${order.orderNumber}`}>{t("order.failed.retry")}</Link>
          </Button>
        ) : null}
        <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6">
          <Link href="/contact">{t("order.contactUs")}</Link>
        </Button>
      </div>
    </div>
  );
}

export default async function FailedPage({
  params,
}: PageProps<"/[locale]/checkout/failed/[orderNumber]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <Suspense fallback={<OrderPageSkeleton />}>
      <OrderPageShell>
        <Failure locale={locale} params={params} />
      </OrderPageShell>
    </Suspense>
  );
}
