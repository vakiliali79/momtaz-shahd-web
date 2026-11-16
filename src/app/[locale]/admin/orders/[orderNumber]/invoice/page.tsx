import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/account/print-button";
import { AdminPageSkeleton } from "@/components/admin/admin-ui";
import { InvoiceDocument } from "@/components/orders/invoice-document";
import { Link } from "@/i18n/navigation";
import { currentLocale } from "@/lib/locale";
import { getOrderForAdmin } from "@/lib/orders/queries";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/orders/[orderNumber]/invoice">): Promise<Metadata> {
  const [{ orderNumber }, t] = await Promise.all([params, getTranslations("accountPages.invoice")]);
  return { title: t("title", { number: orderNumber }) };
}

async function AdminInvoice({ params }: { params: PageProps<"/[locale]/admin/orders/[orderNumber]/invoice">["params"] }) {
  const [locale, { orderNumber }] = await Promise.all([currentLocale(), params]);
  await requireAdmin(locale, `/admin/orders/${orderNumber}/invoice`);
  const order = await getOrderForAdmin(orderNumber);
  if (!order) notFound();
  const t = await getTranslations("accountPages.invoice");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/orders/${order.orderNumber}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowRightIcon className="size-4 ltr:rotate-180" aria-hidden="true" />
          {t("back")}
        </Link>
        <PrintButton />
      </div>
      <InvoiceDocument order={order} locale={locale} />
    </div>
  );
}

export default function AdminInvoicePage({ params }: PageProps<"/[locale]/admin/orders/[orderNumber]/invoice">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminInvoice params={params} />
    </Suspense>
  );
}
