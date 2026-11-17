import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { UrlPager } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { ReviewList } from "@/components/admin/reviews/review-list";
import { parseFilter, parseListParams } from "@/lib/admin/list-params";
import { listAdminReviews, reviewRatingFilters, reviewSorts, reviewStateFilters } from "@/lib/admin/reviews";
import { formatNumber } from "@/lib/format";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.reviews");
  return { title: t("title") };
}

async function Reviews({ searchParams }: { searchParams: PageProps<"/[locale]/admin/reviews">["searchParams"] }) {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/reviews");
  const raw = await searchParams;
  const params = parseListParams(raw, reviewSorts, { sort: "createdAt", desc: true });
  // Pending reviews first: that is the moderation queue.
  const state = raw.state === "all" ? undefined : (parseFilter(raw, "state", reviewStateFilters) ?? "pending");
  const filters = { state, rating: parseFilter(raw, "rating", reviewRatingFilters) };
  const [t, { rows, total }] = await Promise.all([getTranslations("admin.reviews"), listAdminReviews(params, filters, locale)]);

  return (
    <>
      <AdminHeading title={t("title")} description={t("description")} />
      <ListToolbar
        searchPlaceholder={t("search")}
        filters={[
          {
            key: "state",
            label: t("filters.state"),
            options: reviewStateFilters.map((v) => ({ value: v, label: t(`states.${v}`) })),
            fallback: { value: "pending", allValue: "all" },
          },
          {
            key: "rating",
            label: t("filters.rating"),
            options: reviewRatingFilters.map((v) => ({ value: v, label: t("stars", { count: Number(v), value: formatNumber(Number(v), locale) }) })),
          },
        ]}
      />
      <div className="space-y-4">
        <ReviewList reviews={rows} />
        <UrlPager page={params.page} pageSize={params.pageSize} rowCount={total} />
      </div>
    </>
  );
}

export default function AdminReviewsPage({ searchParams }: PageProps<"/[locale]/admin/reviews">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Reviews searchParams={searchParams} />
    </Suspense>
  );
}
