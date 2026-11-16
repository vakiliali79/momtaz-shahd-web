import { z } from "zod";

import { routing } from "@/i18n/routing";

/** Error messages are translation keys under `accountPages.profile.errors`. */
export const profileSchema = z.object({
  name: z.string().trim().min(2, "nameRequired").max(80, "tooLong"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "tooLong")
    .pipe(z.union([z.literal(""), z.email("invalidEmail")], { error: "invalidEmail" })),
  preferredLocale: z.enum(routing.locales, { error: "invalidLocale" }),
});
export type ProfileInput = z.input<typeof profileSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().max(128, "tooLong"),
    newPassword: z
      .string()
      .min(8, "passwordTooShort")
      .max(128, "tooLong")
      .regex(/[A-Za-z]/, "passwordWeak")
      .regex(/\d/, "passwordWeak"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  });
export type PasswordInput = z.input<typeof passwordSchema>;

export const profileErrorKeys = [
  "nameRequired",
  "invalidEmail",
  "emailTaken",
  "invalidLocale",
  "tooLong",
  "passwordTooShort",
  "passwordWeak",
  "passwordMismatch",
  "wrongPassword",
  "unauthorized",
  "server",
] as const;
export type ProfileErrorKey = (typeof profileErrorKeys)[number];

export function toProfileErrorKey(message: string | undefined): ProfileErrorKey {
  return profileErrorKeys.find((key) => key === message) ?? "server";
}
