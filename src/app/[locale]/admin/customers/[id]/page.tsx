import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { OrderStatusBadge } from "@/components/account/account-ui";
import { AdminCard, AdminHeading, AdminPageSkeleton, Pill } from "@/components/admin/admin-ui";
import { CustomerControls } from "@/components/admin/customers/customer-controls";
import { roleTone } from "@/components/admin/customers/customers-table";
import { Link } from "@/i18n/navigation";
import { getAdminCustomer } from "@/lib/admin/customers";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { currentLocale } from "@/lib/locale";
import { getCity, getProvince } from "@/lib/locations";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.customers");
  return { title: t("detail.title") };
}

async function Customer({ params }: { params: PageProps<"/[locale]/admin/customers/[id]">["params"] }) {
  const [locale, { id }] = await Promise.all([currentLocale(), params]);
  const admin = await requireAdmin(locale, `/admin/customers/${id}`);
  const customer = await getAdminCustomer(id);
  if (!customer) notFound();
  const [t, tOrders, tCommon] = await Promise.all([
    getTranslations("admin.customers"),
    getTranslations("admin.orders"),
    getTranslations("common"),
  ]);
  const toman = tCommon("toman");
  const editable = customer.role !== "ADMIN" && customer.id !== admin.id;

  return (
    <>
      <AdminHeading
        title={customer.name || t("noName")}
        description={t("detail.joined", { date: formatDate(customer.createdAt, locale, { dateStyle: "long" }) })}
        actions={
          <>
            <Pill tone={roleTone[customer.role]}>{t(`roles.${customer.role}`)}</Pill>
            {customer.isBlocked ? <Pill tone="red">{t("states.blocked")}</Pill> : null}
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
        <div className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-3">
            {[
              { label: t("detail.orders"), value: formatNumber(customer._count.orders, locale) },
              { label: t("detail.spent"), value: formatPrice(customer.totalSpent, locale, toman) },
              { label: t("detail.reviews"), value: formatNumber(customer._count.reviews, locale) },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 text-xl font-bold">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <AdminCard title={t("detail.orderList")}>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("detail.noOrders")}</p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[30rem] text-sm">
                  <caption className="sr-only">{t("detail.orderList")}</caption>
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="pb-2 text-start font-medium">{tOrders("columns.number")}</th>
                      <th scope="col" className="pb-2 text-start font-medium">{tOrders("columns.date")}</th>
                      <th scope="col" className="pb-2 text-start font-medium">{tOrders("columns.total")}</th>
                      <th scope="col" className="pb-2 text-start font-medium">{tOrders("columns.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customer.orders.map((order) => (
                      <tr key={order.orderNumber}>
                        <td className="py-2.5">
                          <Link href={`/admin/orders/${order.orderNumber}`} className="touch-target font-medium hover:text-primary" dir="ltr">{order.orderNumber}</Link>
                        </td>
                        <td className="py-2.5 whitespace-nowrap">{formatDate(order.createdAt, locale, { dateStyle: "medium" })}</td>
                        <td className="py-2.5 whitespace-nowrap">{formatPrice(order.total, locale, toman)}</td>
                        <td className="py-2.5"><OrderStatusBadge status={order.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        </div>
        <div className="space-y-6">
          <AdminCard title={t("detail.contact")}>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t("columns.phone")}</dt><dd dir="ltr"><a href={`tel:${customer.phone}`} className="touch-target hover:text-primary">{customer.phone}</a></dd></div>
              {customer.email ? <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t("detail.email")}</dt><dd dir="ltr" className="truncate">{customer.email}</dd></div> : null}
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t("detail.language")}</dt><dd>{customer.preferredLocale.toUpperCase()}</dd></div>
            </dl>
          </AdminCard>
          {editable && customer.role !== "ADMIN" ? (
            <CustomerControls id={customer.id} role={customer.role} isBlocked={customer.isBlocked} />
          ) : (
            <AdminCard><p className="text-sm text-muted-foreground">{t("detail.notEditable")}</p></AdminCard>
          )}
          <AdminCard title={t("detail.addresses")}>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("detail.noAddresses")}</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {customer.addresses.map((address) => {
                  const province = getProvince(address.province);
                  const city = getCity(address.province, address.city);
                  return (
                    <li key={address.id}>
                      <p className="font-medium">{address.title}</p>
                      <p className="text-muted-foreground">
                        {t("detail.addressLine", {
                          province: province?.name[locale] ?? address.province,
                          city: city?.name[locale] ?? address.city,
                          address: address.fullAddress,
                        })}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>
    </>
  );
}

export default function AdminCustomerPage({ params }: PageProps<"/[locale]/admin/customers/[id]">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Customer params={params} />
    </Suspense>
  );
}
