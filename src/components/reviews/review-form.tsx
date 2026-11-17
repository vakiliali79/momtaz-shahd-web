"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { StarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { submitReview, type ReviewResult } from "@/actions/review";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  REVIEW_COMMENT_MAX,
  reviewSchema,
  toReviewErrorKey,
  type ReviewInput,
} from "@/lib/validation/review";

/** Accessible 1–5 star picker built from native radio buttons. */
function StarRating({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: number;
  onChange: (value: number) => void;
  invalid: boolean;
  describedBy?: string;
}) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const name = useId();
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <fieldset aria-describedby={describedBy} aria-invalid={invalid || undefined}>
      <legend className="mb-2 text-sm font-medium">{t("rating")}</legend>
      <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label
            key={star}
            onMouseEnter={() => setHovered(star)}
            className="cursor-pointer rounded-md p-0.5 has-focus-visible:outline-2 has-focus-visible:outline-ring"
          >
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="sr-only"
            />
            <span className="sr-only">{t("stars", { count: star, formatted: formatNumber(star, locale) })}</span>
            <StarIcon
              aria-hidden="true"
              className={cn("size-8 transition-colors", star <= shown ? "fill-brand-gold text-gold-ink" : "text-border")}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ReviewForm({
  productId,
  initial,
}: {
  productId: string;
  initial?: { rating: number; comment: string };
}) {
  const t = useTranslations("reviews");
  const router = useRouter();
  const id = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { productId, rating: initial?.rating ?? 0, comment: initial?.comment ?? "" },
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        const result = await submitReview(values).catch((): ReviewResult => ({ ok: false, error: "server" }));
        if (result.ok) {
          toast.success(t("submitted"));
          router.refresh();
        } else {
          setFormError(result.error);
        }
      })}
    >
      {formError ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t(`errors.${toReviewErrorKey(formError)}`)}
        </p>
      ) : null}
      <Controller
        control={control}
        name="rating"
        render={({ field }) => (
          <StarRating
            value={field.value}
            onChange={field.onChange}
            invalid={Boolean(errors.rating)}
            describedBy={errors.rating ? `${id}-rating-error` : undefined}
          />
        )}
      />
      {errors.rating ? (
        <p id={`${id}-rating-error`} role="alert" className="text-sm text-destructive">
          {t(`errors.${toReviewErrorKey(errors.rating.message)}`)}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor={`${id}-comment`}>{t("comment")}</Label>
        <Textarea
          id={`${id}-comment`}
          rows={4}
          maxLength={REVIEW_COMMENT_MAX}
          dir="auto"
          placeholder={t("commentPlaceholder")}
          aria-invalid={errors.comment ? true : undefined}
          className="rounded-xl px-3.5 py-3"
          {...register("comment")}
        />
        {errors.comment ? (
          <p role="alert" className="text-sm text-destructive">
            {t(`errors.${toReviewErrorKey(errors.comment.message)}`)}
          </p>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{t("moderationNote")}</p>
      <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-6">
        {isSubmitting ? t("submitting") : initial ? t("update") : t("submit")}
      </Button>
    </form>
  );
}
