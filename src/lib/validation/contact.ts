import { z } from "zod";

import { routing } from "@/i18n/routing";
import { IRAN_MOBILE_REGEX, normalizeIranMobile } from "@/lib/validation/phone";

/**
 * Shared by the contact form (client) and its server action.
 * Error messages are translation keys under `contact.errors`.
 */
export const contactSchema = z
  .object({
    name: z.string().trim().min(2, "nameRequired").max(80, "tooLong"),
    phone: z
      .string()
      .trim()
      .transform((value) => (value === "" ? "" : normalizeIranMobile(value)))
      .pipe(
        z.union([z.literal(""), z.string().regex(IRAN_MOBILE_REGEX, "invalidPhone")], {
          error: "invalidPhone",
        }),
      ),
    email: z
      .string()
      .trim()
      .max(254, "tooLong")
      .pipe(z.union([z.literal(""), z.email("invalidEmail")], { error: "invalidEmail" })),
    subject: z.string().trim().max(120, "tooLong"),
    message: z.string().trim().min(10, "messageTooShort").max(3000, "tooLong"),
    locale: z.enum(routing.locales),
    /** Honeypot: real visitors never see or fill this field. */
    website: z.string().max(0).optional(),
  })
  .refine((data) => data.phone !== "" || data.email !== "", {
    path: ["phone"],
    message: "contactRequired",
  });

export type ContactInput = z.input<typeof contactSchema>;

export const contactErrorKeys = [
  "nameRequired",
  "contactRequired",
  "invalidPhone",
  "invalidEmail",
  "messageTooShort",
  "tooLong",
  "tooMany",
  "server",
] as const;
export type ContactErrorKey = (typeof contactErrorKeys)[number];

export function toContactErrorKey(message: string | undefined): ContactErrorKey {
  return contactErrorKeys.find((key) => key === message) ?? "server";
}
