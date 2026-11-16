"use client";

import { useTransition } from "react";
import { CheckIcon, StarIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { approveReview, rejectReview } from "@/actions/admin/reviews";
import { Pill } from "@/components/admin/admin-ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { AdminReviewRow } from "@/lib/admin/reviews";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} aria-hidden="true" className={cn("size-4", star <= rating ? "fill-brand-gold text-brand-gold" : "text-muted-foreground/40")} />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: AdminReviewRow }) {
  const t = useTranslations("admin.reviews");
  const tErrors = useTranslations("admin.errors");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Stars rating={review.rating} label={t("rating", { value: formatNumber(review.rating, locale) })} />
            {review.isApproved ? <Pill tone="green">{t("states.approved")}</Pill> : <Pill tone="gold">{t("states.pending")}</Pill>}
          </div>
          <p className="text-sm">
            <Link href={`/products/${review.productSlug}`} className="font-medium hover:text-primary">{review.productName}</Link>
            <span className="text-muted-foreground"> · </span>
            <Link href={`/admin/customers/${review.customerId}`} className="text-muted-foreground hover:text-primary">{review.customerName}</Link>
          </p>
        </div>
        <time dateTime={review.createdAt} className="text-xs text-muted-foreground">{formatDate(review.createdAt, locale, { dateStyle: "medium" })}</time>
      </div>
      <p className={cn("mt-3 text-sm whitespace-pre-line", !review.comment && "text-muted-foreground italic")} dir="auto">
        {review.comment || t("noComment")}
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {!review.isApproved ? (
          <Button
            size="sm"
            className="rounded-full"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await approveReview(review.id);
                if (result.ok) {
                  toast.success(t("approved"));
                  router.refresh();
                } else toast.error(tErrors(result.error));
              })
            }
          >
            <CheckIcon aria-hidden="true" />
            {t("approve")}
          </Button>
        ) : null}
        <ConfirmButton
          trigger={
            <Button size="sm" variant="ghost" className="rounded-full text-destructive" disabled={pending}>
              <XIcon aria-hidden="true" />
              {review.isApproved ? t("remove") : t("reject")}
            </Button>
          }
          title={t("rejectTitle")}
          description={t("rejectText")}
          confirmLabel={review.isApproved ? t("remove") : t("reject")}
          destructive
          onConfirm={async () => {
            const result = await rejectReview(review.id);
            if (result.ok) {
              toast.success(t("rejected"));
              router.refresh();
            } else toast.error(tErrors(result.error));
          }}
        />
      </div>
    </li>
  );
}

export function ReviewList({ reviews }: { reviews: AdminReviewRow[] }) {
  const t = useTranslations("admin.reviews");
  if (reviews.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">{t("empty")}</p>;
  }
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </ul>
  );
}
