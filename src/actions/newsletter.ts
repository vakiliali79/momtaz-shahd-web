"use server";

import {
  newsletterSchema,
  toNewsletterErrorKey,
  type NewsletterErrorKey,
} from "@/lib/validation/newsletter";

export type NewsletterResult =
  | { ok: true }
  | { ok: false; error: NewsletterErrorKey };

export async function subscribeToNewsletter(
  input: unknown,
): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: toNewsletterErrorKey(parsed.error.issues[0]?.message),
    };
  }

  // TODO: persist the subscriber once the database (Prisma) stage lands.
  return { ok: true };
}
