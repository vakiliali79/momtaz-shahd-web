import type { Metadata } from "next";
import { Suspense } from "react";
import { CircleCheckIcon, ClockIcon, LandmarkIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { OrderPageShell, OrderPageSkeleton } from "@/app/[locale]/checkout/order-page";
import { OrderDetails } from "@/components/orders/order-details";
import { ReceiptUpload } from "@/components/orders/receipt-upload";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { getBankTransferInfo } from "@/lib/data/settings";
import { formatDate, formatPrice } from "@/lib/format";
import { getOrderForUser } from "@/lib/orders/queries";
import { isOnlinePaymentEnabled } from "@/lib/payments";
import { requireUser } from "@/lib/session";

// Private, per-order page: there is nothing to prerender, so navigation to it
// waits for the server instead of showing a prefetched shell.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("order.success");
  return { title: t("title"), robots: { index: false, follow: false } };
}

async function Confirmation({
  locale,
  params,
}: {
  locale: AppLocale;
  params: PageProps<"/[locale]/checkout/success/[orderNumber]">["params"];
}) {
  const { orderNumber } = await params;
  const user = await requireUser(locale, `/checkout/success/${orderNumber}`);
  const order = await getOrderForUser(orderNumber, user.id);
  if (!order) notFound();

  if (order.paymentMethod === "ONLINE" && order.status === "CANCELLED") {
    redirect(`/${locale}/checkout/failed/${order.orderNumber}`);
  }

  const t = await getTranslations();
  const awaitingOnline = order.paymentMethod === "ONLINE" && order.status === "PENDING";
  const awaitingTransfer = order.paymentMethod === "BANK_TRANSFER" && order.status === "PENDING";
  const bank = awaitingTransfer ? await getBankTransferInfo() : null;
  const Icon = awaitingOnline ? ClockIcon : CircleCheckIcon;

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <Icon
          className={awaitingOnline ? "mx-auto size-16 text-brand-gold" : "mx-auto size-16 text-brand-leaf"}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <h1 className="text-fluid-2xl font-bold">
          {awaitingOnline ? t("order.success.awaitingTitle") : t("order.success.title")}
        </h1>
        <p className="mx-auto max-w-xl text-pretty text-muted-foreground">
          {awaitingOnline
            ? t("order.success.awaitingText")
            : t("order.success.thanks")}{" "}
          {awaitingOnline
            ? null
            : order.paymentMethod === "BANK_TRANSFER" && !awaitingTransfer
              ? t("order.success.next.transferConfirmed")
              : t(`order.success.next.${order.paymentMethod}`)}
        </p>
        {awaitingOnline && isOnlinePaymentEnabled() ? (
          <Button asChild size="lg" className="h-12 rounded-full px-8 text-base">
            <Link href={`/checkout/pay/${order.orderNumber}`}>{t("order.payNow")}</Link>
          </Button>
        ) : null}
      </div>

      {bank ? (
        <section aria-labelledby="bank-details" className="rounded-2xl border border-brand-gold/40 bg-secondary/50 p-5">
          <h2 id="bank-details" className="mb-3 flex items-center gap-2 font-semibold">
            <LandmarkIcon className="size-5 text-brand-gold" aria-hidden="true" />
            {t("order.bank.title")}
          </h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">{t("order.bank.amount")}</dt>
              <dd className="font-semibold">{formatPrice(order.total, locale, t("common.toman"))}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("order.bank.bankName")}</dt>
              <dd className="font-semibold">{bank.bankName[locale]}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("order.bank.accountHolder")}</dt>
              <dd className="font-semibold">{bank.accountHolder[locale]}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("order.bank.sheba")}</dt>
              <dd className="font-semibold break-all" dir="ltr">{bank.sheba}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("order.bank.card")}</dt>
              <dd className="font-semibold" dir="ltr">{bank.cardNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("order.bank.reference")}</dt>
              <dd className="font-semibold" dir="ltr">{order.orderNumber}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">{t("order.bank.instructions")}</p>
        </section>
      ) : null}

      {awaitingTransfer ? (
        <section aria-labelledby="receipt-title" className="rounded-2xl border border-border p-5">
          <h2 id="receipt-title" className="mb-1 font-semibold">{t("receipt.title")}</h2>
          {order.receiptUploadedAt ? (
            <div className="space-y-3">
              <p role="status" className="text-sm text-brand-leaf dark:text-success">
                {t("receipt.received", {
                  date: formatDate(order.receiptUploadedAt, locale, { dateStyle: "medium", timeStyle: "short" }),
                })}
              </p>
              {order.transferReference ? (
                <p className="text-sm text-muted-foreground">
                  {t("receipt.referenceLine")} <span dir="ltr">{order.transferReference}</span>
                </p>
              ) : null}
              <a
                href={`/api/orders/${order.orderNumber}/receipt`}
                target="_blank"
                rel="noopener"
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                {t("receipt.view")}
              </a>
              <details className="rounded-xl bg-muted/50 p-4">
                <summary className="cursor-pointer text-sm font-medium">{t("receipt.replace")}</summary>
                <div className="mt-4">
                  <ReceiptUpload orderNumber={order.orderNumber} />
                </div>
              </details>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{t("receipt.text")}</p>
              <ReceiptUpload orderNumber={order.orderNumber} />
            </>
          )}
        </section>
      ) : null}

      <OrderDetails order={order} />

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6">
          <Link href="/products">{t("cart.continueShopping")}</Link>
        </Button>
        <Button asChild size="lg" variant="ghost" className="h-11 rounded-full px-6">
          <Link href="/contact">{t("order.contactUs")}</Link>
        </Button>
      </div>
    </div>
  );
}

export default async function SuccessPage({
  params,
}: PageProps<"/[locale]/checkout/success/[orderNumber]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <Suspense fallback={<OrderPageSkeleton />}>
      <OrderPageShell>
        <Confirmation locale={locale} params={params} />
      </OrderPageShell>
    </Suspense>
  );
}
