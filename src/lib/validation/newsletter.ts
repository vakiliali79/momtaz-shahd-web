import { z } from "zod";

/**
 * Error messages are translation keys under `newsletter.errors`, so the same
 * schema can be shared by the client form and the server action.
 */
export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "required")
    .max(254, "tooLong")
    .pipe(z.email("invalid")),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const newsletterErrorKeys = ["required", "invalid", "tooLong", "server"] as const;
export type NewsletterErrorKey = (typeof newsletterErrorKeys)[number];

export function toNewsletterErrorKey(message: string | undefined): NewsletterErrorKey {
  return newsletterErrorKeys.find((key) => key === message) ?? "invalid";
}
