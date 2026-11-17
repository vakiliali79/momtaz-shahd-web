import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { CouponForm } from "@/components/admin/coupons/coupon-form";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.coupons");
  return { title: t("new") };
}

async function NewCoupon() {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/coupons/new");
  const t = await getTranslations("admin.coupons");
  return (
    <div className="mx-auto max-w-3xl">
      <AdminHeading title={t("new")} />
      <CouponForm couponId={null} />
    </div>
  );
}

export default function NewCouponPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <NewCoupon />
    </Suspense>
  );
}
