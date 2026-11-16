import type { Metadata } from "next";
import { Suspense } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton, Pill } from "@/components/admin/admin-ui";
import { CouponActiveSwitch, DeleteCouponButton } from "@/components/admin/coupons/coupon-row-actions";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listAdminCoupons } from "@/lib/admin/coupons";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.coupons");
  return { title: t("title") };
}

async function Coupons() {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/coupons");
  const [t, tCommon, coupons] = await Promise.all([getTranslations("admin.coupons"), getTranslations("common"), listAdminCoupons()]);
  const toman = tCommon("toman");

  return (
    <>
      <AdminHeading
        title={t("title")}
        description={t("description")}
        actions={
          <Button asChild className="rounded-full">
            <Link href="/admin/coupons/new"><PlusIcon aria-hidden="true" />{t("new")}</Link>
          </Button>
        }
      />
      <div className="relative overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[44rem] text-sm">
          <caption className="sr-only">{t("title")}</caption>
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.code")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.discount")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.minOrder")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.uses")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.expires")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.active")}</th>
              <th scope="col" className="p-3"><span className="sr-only">{t("columns.actions")}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.length === 0 ? (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">{t("empty")}</td></tr>
            ) : (
              coupons.map((coupon) => {
                const { expired, usedUp } = coupon;
                return (
                  <tr key={coupon.id}>
                    <td className="p-3">
                      <Link href={`/admin/coupons/${coupon.id}`} className="touch-target font-mono font-semibold hover:text-primary" dir="ltr">{coupon.code}</Link>
                      {expired ? <span className="ms-2"><Pill tone="red">{t("expired")}</Pill></span> : null}
                      {usedUp ? <span className="ms-2"><Pill tone="muted">{t("usedUp")}</Pill></span> : null}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {coupon.type === "PERCENT" ? t("percentValue", { value: formatNumber(coupon.value, locale) }) : formatPrice(coupon.value, locale, toman)}
                    </td>
                    <td className="p-3 whitespace-nowrap">{coupon.minOrder > 0 ? formatPrice(coupon.minOrder, locale, toman) : "—"}</td>
                    <td className="p-3 whitespace-nowrap">
                      {coupon.maxUses === null
                        ? t("usesUnlimited", { used: formatNumber(coupon.usedCount, locale) })
                        : t("usesOf", { used: formatNumber(coupon.usedCount, locale), max: formatNumber(coupon.maxUses, locale) })}
                    </td>
                    <td className="p-3 whitespace-nowrap">{coupon.expiresAt ? formatDate(coupon.expiresAt, locale, { dateStyle: "medium" }) : t("never")}</td>
                    <td className="p-3"><CouponActiveSwitch id={coupon.id} code={coupon.code} active={coupon.isActive} /></td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon-sm" aria-label={t("editFor", { code: coupon.code })}>
                          <Link href={`/admin/coupons/${coupon.id}`}><PencilIcon aria-hidden="true" /></Link>
                        </Button>
                        <DeleteCouponButton id={coupon.id} code={coupon.code} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function CouponsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Coupons />
    </Suspense>
  );
}
