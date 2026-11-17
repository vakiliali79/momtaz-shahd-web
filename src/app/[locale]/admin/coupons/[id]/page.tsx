import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { CouponForm } from "@/components/admin/coupons/coupon-form";
import { getCouponForEdit } from "@/lib/admin/coupons";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.coupons");
  return { title: t("edit") };
}

async function EditCoupon({ params }: { params: PageProps<"/[locale]/admin/coupons/[id]">["params"] }) {
  const [locale, { id }] = await Promise.all([currentLocale(), params]);
  await requireAdmin(locale, `/admin/coupons/${id}`);
  const coupon = await getCouponForEdit(id);
  if (!coupon) notFound();
  const t = await getTranslations("admin.coupons");
  return (
    <div className="mx-auto max-w-3xl">
      <AdminHeading title={t("editNamed", { code: coupon.code })} />
      <CouponForm couponId={id} initial={coupon} />
    </div>
  );
}

export default function EditCouponPage({ params }: PageProps<"/[locale]/admin/coupons/[id]">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <EditCoupon params={params} />
    </Suspense>
  );
}
