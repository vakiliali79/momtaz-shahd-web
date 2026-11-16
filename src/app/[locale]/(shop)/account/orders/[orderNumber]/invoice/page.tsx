import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountPageSkeleton } from "@/components/account/account-ui";
import { PrintButton } from "@/components/account/print-button";
import { InvoiceDocument } from "@/components/orders/invoice-document";
import { Link } from "@/i18n/navigation";
import { currentLocale } from "@/lib/locale";
import { getOrderForUser } from "@/lib/orders/queries";
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

      <InvoiceDocument order={order} locale={locale} />
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
