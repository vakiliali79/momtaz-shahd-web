import type { Metadata } from "next";
import { Suspense } from "react";
import { FlaskConicalIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { OrderPageShell, OrderPageSkeleton } from "@/app/[locale]/checkout/order-page";
import { Button } from "@/components/ui/button";
import { routing, type AppLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getPaymentGateway } from "@/lib/payments";

// Simulated bank page; nothing to prerender.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("payment.mock");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** The fake bank page of the mock gateway (development only). */
async function MockBank({
  locale,
  searchParams,
}: {
  locale: AppLocale;
  searchParams: PageProps<"/[locale]/payment/mock">["searchParams"];
}) {
  const query = await searchParams;
  if (getPaymentGateway()?.id !== "mock") notFound();
  const t = await getTranslations();

  const authority = typeof query.authority === "string" ? query.authority : "";
  const callback = typeof query.callback === "string" ? query.callback : "";
  const payment = /^MOCK[0-9A-F]{24}$/.test(authority)
    ? await db.payment.findUnique({
        where: { authority },
        select: { status: true, amount: true, order: { select: { orderNumber: true } } },
      })
    : null;

  if (!payment || payment.status !== "PENDING" || !callback) {
    return <p className="text-center text-muted-foreground">{t("payment.mock.invalid")}</p>;
  }
  const amount = formatPrice(Number(payment.amount), locale, t("common.toman"));

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl border-2 border-dashed border-brand-gold/60 bg-card p-6 text-center shadow-soft sm:p-8">
      <FlaskConicalIcon className="mx-auto size-12 text-brand-gold" strokeWidth={1.5} aria-hidden="true" />
      <div className="space-y-2">
        <h1 className="text-fluid-lg font-bold">{t("payment.mock.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("payment.mock.text")}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/60 p-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t("order.number")}</dt>
          <dd className="font-semibold" dir="ltr">{payment.order.orderNumber}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("order.amount")}</dt>
          <dd className="font-semibold">{amount}</dd>
        </div>
      </dl>
      {/* A plain form POST (full page load), like returning from a real bank site. */}
      <form method="post" action="/api/payment/mock" className="flex flex-col gap-3">
        <input type="hidden" name="authority" value={authority} />
        <input type="hidden" name="callback" value={callback} />
        <Button type="submit" name="decision" value="pay" size="lg" className="h-12 rounded-full text-base">
          {t("payment.mock.pay", { amount })}
        </Button>
        <Button type="submit" name="decision" value="cancel" variant="outline" size="lg" className="h-12 rounded-full">
          {t("payment.mock.cancel")}
        </Button>
        <Button type="submit" name="decision" value="timeout" variant="ghost" size="lg" className="h-11 rounded-full text-sm">
          {t("payment.mock.timeout")}
        </Button>
      </form>
    </div>
  );
}

export default async function MockGatewayPage({ searchParams }: PageProps<"/[locale]/payment/mock">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  return (
    <Suspense fallback={<OrderPageSkeleton />}>
      <OrderPageShell>
        <MockBank locale={locale} searchParams={searchParams} />
      </OrderPageShell>
    </Suspense>
  );
}
