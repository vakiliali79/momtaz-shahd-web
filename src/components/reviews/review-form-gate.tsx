import { getTranslations } from "next-intl/server";

import { ReviewForm } from "@/components/reviews/review-form";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { canReviewProduct } from "@/lib/account/queries";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

/**
 * The review form, shown only to customers with a delivered order that
 * contains this product. Reads the session: render inside <Suspense>.
 */
export async function ReviewFormGate({
  productId,
  productSlug,
  locale,
}: {
  productId: string;
  productSlug: string;
  locale: AppLocale;
}) {
  const [t, user] = await Promise.all([getTranslations("reviews"), getSessionUser()]);

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("signInPrompt")}{" "}
        <Link
          href={{ pathname: "/login", query: { callbackUrl: `/${locale}/products/${productSlug}` } }}
          className="touch-target font-medium text-primary hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
    );
  }

  if (!(await canReviewProduct(user.id, productId))) {
    return <p className="text-sm text-muted-foreground">{t("onlyBuyers")}</p>;
  }

  const existing = await db.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
    select: { rating: true, comment: true, isApproved: true },
  });

  return (
    <section aria-labelledby="write-review" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 id="write-review" className="mb-1 font-semibold">
        {existing ? t("editTitle") : t("writeTitle")}
      </h3>
      {existing ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {existing.isApproved ? t("statusPublished") : t("statusPending")}
        </p>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">{t("writeText")}</p>
      )}
      <ReviewForm
        productId={productId}
        initial={existing ? { rating: existing.rating, comment: existing.comment ?? "" } : undefined}
      />
    </section>
  );
}
