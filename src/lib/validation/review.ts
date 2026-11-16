import { z } from "zod";

export const REVIEW_COMMENT_MAX = 1000;

/** Error messages are translation keys under `reviews.errors`. */
export const reviewSchema = z.object({
  productId: z.string().min(1).max(64),
  rating: z
    .number({ error: "ratingRequired" })
    .int("ratingRequired")
    .min(1, "ratingRequired")
    .max(5, "ratingRequired"),
  comment: z.string().trim().max(REVIEW_COMMENT_MAX, "tooLong"),
});
export type ReviewInput = z.input<typeof reviewSchema>;

export const reviewErrorKeys = ["ratingRequired", "tooLong", "notAllowed", "unauthorized", "server"] as const;
export type ReviewErrorKey = (typeof reviewErrorKeys)[number];

export function toReviewErrorKey(message: string | undefined): ReviewErrorKey {
  return reviewErrorKeys.find((key) => key === message) ?? "server";
}
