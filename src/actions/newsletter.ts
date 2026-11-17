"use server";

import { allowRequest, clientIp } from "@/lib/rate-limit";
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

  if (!allowRequest(`newsletter:ip:${await clientIp()}`, 5, 60 * 60_000)) return { ok: false, error: "tooMany" };

  // TODO: persist the subscriber once the database (Prisma) stage lands.
  return { ok: true };
}
