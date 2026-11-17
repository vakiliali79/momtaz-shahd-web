"use client";

import { useState, useTransition } from "react";
import { StarIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { deleteMyReview, type ReviewResult } from "@/actions/review";
import { AccountEmpty } from "@/components/account/account-ui";
import { RatingStars } from "@/components/product/rating-stars";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { MyReview } from "@/lib/account/queries";
import { formatDate } from "@/lib/format";

export function MyReviews({ initialReviews }: { initialReviews: MyReview[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const [reviews, setReviews] = useState(initialReviews);
  const [pending, startTransition] = useTransition();

  if (reviews.length === 0) {
    return (
      <AccountEmpty
        icon={<StarIcon className="size-7" strokeWidth={1.5} aria-hidden="true" />}
        title={t("accountPages.reviews.emptyTitle")}
        text={t("accountPages.reviews.emptyText")}
      />
    );
  }

  function remove(review: MyReview) {
    startTransition(async () => {
      const result = await deleteMyReview(review.id).catch((): ReviewResult => ({ ok: false, error: "server" }));
      if (result.ok) {
        setReviews((list) => list.filter((entry) => entry.id !== review.id));
        toast.success(t("accountPages.reviews.deleted"));
      } else {
        toast.error(t(`reviews.errors.${result.error}`));
      }
    });
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <Link href={`/products/${review.productSlug}`} className="touch-target font-semibold hover:text-primary">
                {review.productName}
              </Link>
              <RatingStars rating={review.rating} showCount={false} />
            </div>
            <span
              className={
                review.isApproved
                  ? "rounded-full bg-brand-leaf/15 px-2.5 py-0.5 text-xs font-semibold text-leaf-ink"
                  : "rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-xs font-semibold text-gold-ink"
              }
            >
              {review.isApproved ? t("reviews.published") : t("reviews.pending")}
            </span>
          </div>
          {review.comment ? <p dir="auto" className="mt-3 text-sm leading-7">{review.comment}</p> : null}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <time dateTime={review.createdAt}>{formatDate(review.createdAt, locale)}</time>
            <div className="flex gap-1">
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href={`/products/${review.productSlug}`}>{t("accountPages.reviews.edit")}</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-destructive hover:text-destructive"
                disabled={pending}
                onClick={() => remove(review)}
                aria-label={t("accountPages.reviews.deleteFor", { name: review.productName })}
              >
                <Trash2Icon aria-hidden="true" />
                {t("accountPages.reviews.delete")}
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
