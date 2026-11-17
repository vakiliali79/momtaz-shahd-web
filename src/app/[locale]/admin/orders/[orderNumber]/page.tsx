import type { Metadata } from "next";
import { Suspense } from "react";
import { PrinterIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { OrderStatusBadge } from "@/components/account/account-ui";
import { noteKey } from "@/lib/orders/history-notes";
import { AdminCard, AdminHeading, AdminPageSkeleton, Pill } from "@/components/admin/admin-ui";
import { BankTransferPanel, OrderStatusForm, TrackingCodeForm } from "@/components/admin/orders/order-actions";
import { OrderDetails } from "@/components/orders/order-details";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getAdminOrderExtras } from "@/lib/admin/orders";
import { formatDate, formatPrice } from "@/lib/format";
import { currentLocale } from "@/lib/locale";
import { getOrderForAdmin } from "@/lib/orders/queries";
import { allowedNextStatuses } from "@/lib/orders/status";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/orders/[orderNumber]">): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: orderNumber };
}

/** Turns a history note code into something readable for staff. */
function noteLabel(
  note: string | null,
  t: (key: "adminNote" | "systemNote", values: { text: string }) => string,
  known: (key: NonNullable<ReturnType<typeof noteKey>>) => string,
) {
  if (!note) return null;
  if (note.startsWith("admin:")) {
    const text = note.split(":").slice(2).join(":");
    return text ? t("adminNote", { text }) : null;
  }
  const key = noteKey(note);
  return t("systemNote", { text: key ? known(key) : note });
}

async function AdminOrder({ params }: { params: PageProps<"/[locale]/admin/orders/[orderNumber]">["params"] }) {
  const [locale, { orderNumber }] = await Promise.all([currentLocale(), params]);
  await requireAdmin(locale, `/admin/orders/${orderNumber}`);
  const [order, extras] = await Promise.all([getOrderForAdmin(orderNumber), getAdminOrderExtras(orderNumber)]);
  if (!order || !extras) notFound();
  const [t, tStatus, tTimeline] = await Promise.all([
    getTranslations("admin.orders.detail"),
    getTranslations("order.status"),
    getTranslations("accountPages.timeline"),
  ]);
  const label = (note: string | null) => noteLabel(note, t, (key) => tTimeline(key));
  const toman = (await getTranslations("common"))("toman");

  return (
    <>
      <AdminHeading
        title={t("title", { number: order.orderNumber })}
        actions={
          <>
            <OrderStatusBadge status={order.status} />
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/admin/orders/${order.orderNumber}/invoice`}>
                <PrinterIcon aria-hidden="true" />
                {t("invoice")}
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
        <div className="space-y-6">
          <OrderDetails order={order} />
          <AdminCard title={t("history")}>
            <ol className="space-y-3 text-sm">
              {order.history.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{tStatus(entry.status)}</p>
                    {label(entry.note) ? <p className="text-muted-foreground" dir="auto">{label(entry.note)}</p> : null}
                  </div>
                  <time dateTime={entry.createdAt} className="text-xs text-muted-foreground">
                    {formatDate(entry.createdAt, locale, { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </li>
              ))}
            </ol>
          </AdminCard>
          {extras.payments.length > 0 ? (
            <AdminCard title={t("payments")}>
              <ul className="space-y-2 text-sm">
                {extras.payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{payment.gateway} · {formatPrice(payment.amount, locale, toman)} · <span dir="ltr">{payment.refId ?? "—"}</span></span>
                    <Pill tone={payment.status === "PAID" ? "green" : payment.status === "FAILED" ? "red" : "gold"}>{t(`paymentStatus.${payment.status}`)}</Pill>
                  </li>
                ))}
              </ul>
            </AdminCard>
          ) : null}
        </div>
        <div className="space-y-6">
          <AdminCard title={t("customer")}>
            <p className="font-medium">{extras.customer.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground" dir="ltr"><a href={`tel:${extras.customer.phone}`} className="touch-target hover:text-primary">{extras.customer.phone}</a></p>
            {extras.customer.email ? <p className="text-sm text-muted-foreground" dir="ltr">{extras.customer.email}</p> : null}
            <Link href={`/admin/customers/${extras.customer.id}`} className="touch-target mt-2 inline-block text-sm font-medium text-primary hover:underline">{t("viewCustomer")}</Link>
          </AdminCard>
          {order.paymentMethod === "BANK_TRANSFER" && order.status === "PENDING" ? (
            <BankTransferPanel orderNumber={order.orderNumber} hasReceipt={order.receiptUploadedAt !== null} />
          ) : null}
          <OrderStatusForm orderNumber={order.orderNumber} next={allowedNextStatuses(order.status)} />
          <TrackingCodeForm orderNumber={order.orderNumber} current={order.trackingCode} />
        </div>
      </div>
    </>
  );
}

export default function AdminOrderPage({ params }: PageProps<"/[locale]/admin/orders/[orderNumber]">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminOrder params={params} />
    </Suspense>
  );
}
