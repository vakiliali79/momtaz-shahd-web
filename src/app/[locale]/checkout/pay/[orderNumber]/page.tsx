import type { Metadata } from "next";
import { Suspense } from "react";
import { FlaskConicalIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { finishMockPayment } from "@/actions/payment";
import { OrderPageShell, OrderPageSkeleton } from "@/app/[locale]/checkout/order-page";
import { Button } from "@/components/ui/button";
import { routing, type AppLocale } from "@/i18n/routing";
import { formatPrice } from "@/lib/format";
import { getOrderForUser } from "@/lib/orders/queries";
import { getPaymentGateway } from "@/lib/payments";
import { requireUser } from "@/lib/session";

// Private, per-order page: there is nothing to prerender, so navigation to it
// waits for the server instead of showing a prefetched shell.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("order.mockGateway");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * Simulated payment gateway (PAYMENT_GATEWAY=mock). A real gateway redirects
 * to the bank's page instead; this route then becomes its callback.
 */
async function MockGateway({
  locale,
  params,
}: {
  locale: AppLocale;
  params: PageProps<"/[locale]/checkout/pay/[orderNumber]">["params"];
}) {
  const { orderNumber } = await params;
  if (getPaymentGateway() !== "mock") notFound();
  const user = await requireUser(locale, `/checkout/pay/${orderNumber}`);
  const order = await getOrderForUser(orderNumber, user.id);
  if (!order) notFound();
  if (order.paymentMethod !== "ONLINE" || order.status !== "PENDING") {
    redirect(`/${locale}/checkout/success/${order.orderNumber}`);
  }

  const t = await getTranslations();
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl border-2 border-dashed border-brand-gold/60 bg-card p-6 text-center shadow-soft sm:p-8">
      <FlaskConicalIcon className="mx-auto size-12 text-brand-gold" strokeWidth={1.5} aria-hidden="true" />
      <div className="space-y-2">
        <h1 className="text-fluid-lg font-bold">{t("order.mockGateway.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("order.mockGateway.text")}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/60 p-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t("order.number")}</dt>
          <dd className="font-semibold" dir="ltr">{order.orderNumber}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("order.amount")}</dt>
          <dd className="font-semibold">{formatPrice(order.total, locale, t("common.toman"))}</dd>
        </div>
      </dl>
      <form action={finishMockPayment} className="flex flex-col gap-3">
        <input type="hidden" name="orderNumber" value={order.orderNumber} />
        <input type="hidden" name="locale" value={locale} />
        <Button type="submit" name="outcome" value="success" size="lg" className="h-12 rounded-full text-base">
          {t("order.mockGateway.pay")}
        </Button>
        <Button type="submit" name="outcome" value="failure" variant="outline" size="lg" className="h-12 rounded-full">
          {t("order.mockGateway.fail")}
        </Button>
      </form>
    </div>
  );
}

export default async function PayPage({
  params,
}: PageProps<"/[locale]/checkout/pay/[orderNumber]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <Suspense fallback={<OrderPageSkeleton />}>
      <OrderPageShell>
        <MockGateway locale={locale} params={params} />
      </OrderPageShell>
    </Suspense>
  );
}
