import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRightIcon, CreditCardIcon, FileTextIcon, TruckIcon, UploadIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountPageSkeleton, OrderStatusBadge } from "@/components/account/account-ui";
import { CancelOrderButton } from "@/components/account/cancel-order-button";
import { OrderTimeline } from "@/components/account/order-timeline";
import { OrderDetails } from "@/components/orders/order-details";
import { ReorderButton } from "@/components/orders/reorder-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { currentLocale } from "@/lib/locale";
import { canCustomerCancel, getOrderForUser } from "@/lib/orders/queries";
import { isOnlinePaymentEnabled } from "@/lib/payments";
import { requireUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/orders/[orderNumber]">): Promise<Metadata> {
  const [{ orderNumber }, t] = await Promise.all([params, getTranslations("accountPages.orderDetail")]);
  return { title: t("title", { number: orderNumber }) };
}

async function OrderDetail({ params }: { params: PageProps<"/[locale]/account/orders/[orderNumber]">["params"] }) {
  const [locale, { orderNumber }] = await Promise.all([currentLocale(), params]);
  const user = await requireUser(locale, `/account/orders/${orderNumber}`);
  const order = await getOrderForUser(orderNumber, user.id);
  if (!order) notFound();

  const t = await getTranslations();
  const payOnline = order.paymentMethod === "ONLINE" && order.status === "PENDING" && isOnlinePaymentEnabled();
  const uploadReceipt = order.paymentMethod === "BANK_TRANSFER" && order.status === "PENDING";

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link href="/account/orders" className="touch-target inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowRightIcon className="size-4 ltr:rotate-180" aria-hidden="true" />
          {t("accountPages.orderDetail.back")}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-fluid-2xl font-bold">
            {t("accountPages.orderDetail.heading")} <span dir="ltr">{order.orderNumber}</span>
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          {payOnline ? (
            <Button asChild size="lg" className="h-10 rounded-full px-4">
              <Link href={`/checkout/pay/${order.orderNumber}`}>
                <CreditCardIcon aria-hidden="true" />
                {t("order.payNow")}
              </Link>
            </Button>
          ) : null}
          {uploadReceipt ? (
            <Button asChild size="lg" className="h-10 rounded-full px-4">
              <Link href={`/checkout/success/${order.orderNumber}`}>
                <UploadIcon aria-hidden="true" />
                {t("accountPages.orderDetail.receipt")}
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="lg" className="h-10 rounded-full px-4">
            <Link href={`/account/orders/${order.orderNumber}/invoice`}>
              <FileTextIcon aria-hidden="true" />
              {t("accountPages.orderDetail.invoice")}
            </Link>
          </Button>
          <ReorderButton
            items={order.items.map(({ productId, quantity }) => ({ productId, quantity }))}
            variant="outline"
          />
          {canCustomerCancel(order) ? <CancelOrderButton orderNumber={order.orderNumber} /> : null}
        </div>
      </div>

      {order.trackingCode ? (
        <section aria-labelledby="tracking" className="flex items-center gap-3 rounded-2xl border border-brand-leaf/40 bg-brand-leaf/10 p-4">
          <TruckIcon className="size-6 shrink-0 text-leaf-ink" aria-hidden="true" />
          <div>
            <h2 id="tracking" className="text-sm text-muted-foreground">{t("accountPages.orderDetail.trackingCode")}</h2>
            <p className="font-semibold tracking-wide" dir="ltr">{order.trackingCode}</p>
          </div>
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <OrderDetails order={order} />
        <section aria-labelledby="timeline" className="rounded-2xl border border-border p-5 lg:self-start">
          <h2 id="timeline" className="mb-4 font-semibold">{t("accountPages.orderDetail.timeline")}</h2>
          <OrderTimeline history={order.history} />
        </section>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: PageProps<"/[locale]/account/orders/[orderNumber]">) {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}
