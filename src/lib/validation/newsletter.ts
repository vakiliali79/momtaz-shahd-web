import * as z from "zod/mini";

/**
 * Error messages are translation keys under `newsletter.errors`, so the same
 * schema can be shared by the client form and the server action.
 */
// zod/mini: the newsletter form is in the footer of every page, so it uses
// the tree-shakeable build to keep the full Zod library out of the first load.
export const newsletterSchema = z.object({
  email: z.pipe(
    z.string().check(z.trim(), z.minLength(1, "required"), z.maxLength(254, "tooLong")),
    z.email("invalid"),
  ),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const newsletterErrorKeys = ["required", "invalid", "tooLong", "tooMany", "server"] as const;
export type NewsletterErrorKey = (typeof newsletterErrorKeys)[number];

export function toNewsletterErrorKey(message: string | undefined): NewsletterErrorKey {
  return newsletterErrorKeys.find((key) => key === message) ?? "invalid";
}
