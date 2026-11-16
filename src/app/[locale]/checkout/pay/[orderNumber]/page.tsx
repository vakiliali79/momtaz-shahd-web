import type { Metadata } from "next";
import { Suspense } from "react";
import { CircleAlertIcon, CreditCardIcon, LoaderCircleIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { recheckPaymentAction, startPaymentAction } from "@/actions/payment";
import { OrderPageShell, OrderPageSkeleton } from "@/app/[locale]/checkout/order-page";
import { Button } from "@/components/ui/button";
import { routing, type AppLocale } from "@/i18n/routing";
import { formatPrice } from "@/lib/format";
import { getOrderForUser } from "@/lib/orders/queries";
import { getPaymentGateway } from "@/lib/payments";
import { requireUser } from "@/lib/session";

// Private, per-order page: there is nothing to prerender.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("payment.start");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * Payment page for an online order that is not paid yet: after a gateway
 * that could not be reached, an unconfirmed return, or "pay now" later.
 */
async function PayContent({
  locale,
  params,
  searchParams,
}: {
  locale: AppLocale;
  params: PageProps<"/[locale]/checkout/pay/[orderNumber]">["params"];
  searchParams: PageProps<"/[locale]/checkout/pay/[orderNumber]">["searchParams"];
}) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(locale, `/checkout/pay/${orderNumber}`);
  const order = await getOrderForUser(orderNumber, user.id);
  if (!order) notFound();
  if (order.paymentMethod !== "ONLINE" || order.status === "PAID" || order.status === "PROCESSING") {
    redirect(`/${locale}/checkout/success/${order.orderNumber}`);
  }
  if (order.status === "CANCELLED") redirect(`/${locale}/checkout/failed/${order.orderNumber}`);

  const t = await getTranslations();
  const gateway = getPaymentGateway();
  const verifying = query.status === "verifying";
  const requestError = query.error === "request";
  const amount = formatPrice(order.total, locale, t("common.toman"));
  const hidden = (
    <>
      <input type="hidden" name="orderNumber" value={order.orderNumber} />
      <input type="hidden" name="locale" value={locale} />
    </>
  );

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      {verifying ? (
        <LoaderCircleIcon className="mx-auto size-14 text-brand-gold" strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <CreditCardIcon className="mx-auto size-14 text-brand-gold" strokeWidth={1.5} aria-hidden="true" />
      )}
      <div className="space-y-2">
        <h1 className="text-fluid-2xl font-bold">
          {verifying ? t("payment.verifying.title") : t("payment.start.title")}
        </h1>
        <p className="text-pretty text-muted-foreground">
          {verifying ? t("payment.verifying.text") : t("payment.start.text")}
        </p>
      </div>
      {requestError ? (
        <p role="alert" className="flex gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-start text-sm text-destructive">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("payment.start.requestError")}
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/60 p-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t("order.number")}</dt>
          <dd className="font-semibold" dir="ltr">{order.orderNumber}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("order.amount")}</dt>
          <dd className="font-semibold">{amount}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-3">
        {verifying ? (
          <form action={recheckPaymentAction}>
            {hidden}
            <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base">
              {t("payment.verifying.button")}
            </Button>
          </form>
        ) : null}
        {/* While a payment may have gone through, offer only the re-check: paying
            again could charge the customer twice. */}
        {verifying ? null : gateway ? (
          <form action={startPaymentAction}>
            {hidden}
            <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base">
              {t("payment.start.button", { amount })}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">{t("payment.start.unavailable")}</p>
        )}
        {gateway && !verifying ? (
          <p className="text-xs text-muted-foreground">
            {t("payment.start.via", { gateway: t(`payment.gateways.${gateway.id}`) })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default async function PayPage({
  params,
  searchParams,
}: PageProps<"/[locale]/checkout/pay/[orderNumber]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <Suspense fallback={<OrderPageSkeleton />}>
      <OrderPageShell>
        <PayContent locale={locale} params={params} searchParams={searchParams} />
      </OrderPageShell>
    </Suspense>
  );
}
