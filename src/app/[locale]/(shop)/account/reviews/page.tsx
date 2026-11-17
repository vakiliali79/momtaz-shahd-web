import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AccountHeading, AccountPageSkeleton } from "@/components/account/account-ui";
import { MyReviews } from "@/components/account/my-reviews";
import { Link } from "@/i18n/navigation";
import { listMyReviews, listReviewableProducts } from "@/lib/account/queries";
import { currentLocale } from "@/lib/locale";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountPages.reviews");
  return { title: t("title") };
}

async function Reviews() {
  const locale = await currentLocale();
  const user = await requireUser(locale, "/account/reviews");
  const [t, reviews, reviewable] = await Promise.all([
    getTranslations("accountPages.reviews"),
    listMyReviews(user.id, locale),
    listReviewableProducts(user.id, locale),
  ]);

  return (
    <>
      <AccountHeading title={t("title")} description={t("description")} />
      {reviewable.length > 0 ? (
        <section aria-labelledby="to-review" className="mb-6 rounded-2xl border border-brand-gold/40 bg-secondary/50 p-5">
          <h2 id="to-review" className="mb-2 font-semibold">{t("toReview")}</h2>
          <ul className="flex flex-wrap gap-2">
            {reviewable.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.slug}`}
                  className="touch-target inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium hover:border-brand-gold hover:text-primary"
                >
                  {product.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <MyReviews initialReviews={reviews} />
    </>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <Reviews />
    </Suspense>
  );
}
