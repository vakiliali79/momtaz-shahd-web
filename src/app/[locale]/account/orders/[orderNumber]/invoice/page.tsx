import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountPageSkeleton } from "@/components/account/account-ui";
import { PrintButton } from "@/components/account/print-button";
import { LogoMark } from "@/components/layout/logo";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { currentLocale } from "@/lib/locale";
import { getOrderForUser } from "@/lib/orders/queries";
import { placeName } from "@/lib/orders/types";
import { requireUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/orders/[orderNumber]/invoice">): Promise<Metadata> {
  const [{ orderNumber }, t] = await Promise.all([params, getTranslations("accountPages.invoice")]);
  return { title: t("title", { number: orderNumber }) };
}

/**
 * Print-friendly invoice: "Print / Save as PDF" uses the browser's print
 * engine, which lays out Persian and Arabic text correctly (PDF libraries
 * such as react-pdf do not shape RTL scripts reliably).
 */
async function Invoice({ params }: { params: PageProps<"/[locale]/account/orders/[orderNumber]/invoice">["params"] }) {
  const [locale, { orderNumber }] = await Promise.all([currentLocale(), params]);
  const user = await requireUser(locale, `/account/orders/${orderNumber}/invoice`);
  const order = await getOrderForUser(orderNumber, user.id);
  if (!order) notFound();

  const t = await getTranslations();
  const price = (amount: number) => formatPrice(amount, locale, t("common.toman"));
  const address = order.address;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/account/orders/${order.orderNumber}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowRightIcon className="size-4 ltr:rotate-180" aria-hidden="true" />
          {t("accountPages.invoice.back")}
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-2xl border border-border bg-card p-6 text-sm sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <LogoMark className="size-12" />
            <div>
              <p className="text-lg font-bold">{t("brand.name")}</p>
              <p className="text-muted-foreground">{t("brand.tagline")}</p>
              <p className="text-muted-foreground" dir="ltr">{siteConfig.phone} · {siteConfig.email}</p>
            </div>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">{t("accountPages.invoice.number")}</dt>
            <dd className="font-semibold" dir="ltr">{order.orderNumber}</dd>
            <dt className="text-muted-foreground">{t("order.date")}</dt>
            <dd className="font-semibold">{formatDate(order.createdAt, locale)}</dd>
            <dt className="text-muted-foreground">{t("order.statusLabel")}</dt>
            <dd className="font-semibold">{t(`order.status.${order.status}`)}</dd>
          </dl>
        </header>

        <section aria-labelledby="invoice-buyer" className="grid gap-6 border-b border-border py-6 sm:grid-cols-2">
          <div>
            <h2 id="invoice-buyer" className="mb-2 font-semibold">{t("accountPages.invoice.billTo")}</h2>
            {address ? (
              <address className="space-y-0.5 not-italic text-muted-foreground">
                <p className="text-foreground">{address.receiverName}</p>
                <p>
                  {t("address.place", {
                    province: placeName(address.province.name, locale),
                    city: placeName(address.city.name, locale),
                  })}{" "}
                  — {address.fullAddress}
                </p>
                <p>{t("address.postalCodeLine")} <span dir="ltr">{address.postalCode}</span></p>
                <p><span dir="ltr">{address.receiverPhone}</span></p>
              </address>
            ) : null}
          </div>
          <div>
            <h2 className="mb-2 font-semibold">{t("order.payment")}</h2>
            <p className="text-muted-foreground">{t(`checkout.payment.methods.${order.paymentMethod}.name`)}</p>
            {order.paymentRef ? (
              <p className="text-muted-foreground">{t("order.paymentRef")} <span dir="ltr">{order.paymentRef}</span></p>
            ) : null}
            {order.shippingMethod ? (
              <p className="mt-2 text-muted-foreground">{t(`checkout.shipping.methods.${order.shippingMethod}.name`)}</p>
            ) : null}
          </div>
        </section>

        <table className="mt-6 w-full">
          <caption className="sr-only">{t("order.items")}</caption>
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th scope="col" className="pb-2 text-start font-medium">{t("accountPages.invoice.row")}</th>
              <th scope="col" className="pb-2 text-start font-medium">{t("cart.columns.product")}</th>
              <th scope="col" className="pb-2 text-end font-medium">{t("cart.columns.quantity")}</th>
              <th scope="col" className="pb-2 text-end font-medium">{t("cart.columns.price")}</th>
              <th scope="col" className="pb-2 text-end font-medium">{t("cart.columns.total")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map((item, index) => (
              <tr key={item.id}>
                <td className="py-2.5">{formatNumber(index + 1, locale)}</td>
                <td className="py-2.5" dir="auto">{item.productName}</td>
                <td className="py-2.5 text-end">{formatNumber(item.quantity, locale)}</td>
                <td className="py-2.5 text-end whitespace-nowrap">{price(item.unitPrice)}</td>
                <td className="py-2.5 text-end whitespace-nowrap">{price(item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ms-auto mt-6 max-w-xs space-y-1.5">
          <div className="flex justify-between gap-4">
            <dt>{t("cart.subtotal")}</dt>
            <dd>{price(order.subtotal)}</dd>
          </div>
          {order.discount > 0 ? (
            <div className="flex justify-between gap-4">
              <dt>{order.couponCode ? t("cart.discount", { code: order.couponCode }) : t("order.discount")}</dt>
              <dd>−{price(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt>{t("order.shipping")}</dt>
            <dd>{order.shippingCost === 0 ? t("cart.shippingFree") : price(order.shippingCost)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-bold">
            <dt>{t("cart.total")}</dt>
            <dd>{price(order.total)}</dd>
          </div>
        </dl>

        <p className="mt-10 text-center text-xs text-muted-foreground">{t("accountPages.invoice.thanks")}</p>
      </article>
    </div>
  );
}

export default function InvoicePage({ params }: PageProps<"/[locale]/account/orders/[orderNumber]/invoice">) {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <Invoice params={params} />
    </Suspense>
  );
}
