import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminCard, AdminHeading, AdminPageSkeleton, Pill } from "@/components/admin/admin-ui";
import { WholesaleForm } from "@/components/admin/wholesale/wholesale-form";
import { wholesaleTone } from "@/components/admin/wholesale/wholesale-table";
import { Link } from "@/i18n/navigation";
import { getWholesaleRequest } from "@/lib/admin/wholesale";
import { formatDate } from "@/lib/format";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.wholesale");
  return { title: t("detail.title") };
}

async function Request({ params }: { params: PageProps<"/[locale]/admin/wholesale/[id]">["params"] }) {
  const [locale, { id }] = await Promise.all([currentLocale(), params]);
  await requireAdmin(locale, `/admin/wholesale/${id}`);
  const request = await getWholesaleRequest(id, locale);
  if (!request) notFound();
  const t = await getTranslations("admin.wholesale");

  const fields = [
    { label: t("columns.contact"), value: request.contactName },
    { label: t("detail.phone"), value: request.phone, ltr: true, href: `tel:${request.phone}` },
    { label: t("detail.email"), value: request.email, ltr: true, href: request.email ? `mailto:${request.email}` : undefined },
    { label: t("columns.city"), value: request.city },
    { label: t("detail.quantity"), value: request.estimatedQty },
    { label: t("detail.language"), value: request.locale.toUpperCase() },
  ];

  return (
    <>
      <AdminHeading
        title={request.companyName}
        description={t("detail.received", { date: formatDate(request.createdAt, locale, { dateStyle: "long", timeStyle: "short" }) })}
        actions={
          <>
            <Pill tone={request.type === "AGENCY" ? "blue" : "muted"}>{t(`types.${request.type}`)}</Pill>
            <Pill tone={wholesaleTone[request.status]}>{t(`statuses.${request.status}`)}</Pill>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
        <div className="space-y-6">
          <AdminCard title={t("detail.contactInfo")}>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {fields.map((field) =>
                field.value ? (
                  <div key={field.label}>
                    <dt className="text-muted-foreground">{field.label}</dt>
                    <dd className="font-medium" dir={field.ltr ? "ltr" : undefined}>
                      <span className="block text-start">
                        {field.href ? <a href={field.href} className="touch-target hover:text-primary">{field.value}</a> : field.value}
                      </span>
                    </dd>
                  </div>
                ) : null,
              )}
            </dl>
            {request.account ? (
              <Link href={`/admin/customers/${request.account.id}`} className="touch-target mt-4 inline-block text-sm font-medium text-primary hover:underline">
                {t("detail.hasAccount")}
              </Link>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t("detail.noAccount")}</p>
            )}
          </AdminCard>
          <AdminCard title={t("detail.products")}>
            <p className="text-sm whitespace-pre-line" dir="auto">{request.products}</p>
          </AdminCard>
          {request.message ? (
            <AdminCard title={t("detail.message")}>
              <p className="text-sm whitespace-pre-line" dir="auto">{request.message}</p>
            </AdminCard>
          ) : null}
        </div>
        <div className="space-y-6">
          <WholesaleForm id={request.id} status={request.status} adminNote={request.adminNote} />
        </div>
      </div>
    </>
  );
}

export default function AdminWholesaleRequestPage({ params }: PageProps<"/[locale]/admin/wholesale/[id]">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Request params={params} />
    </Suspense>
  );
}
