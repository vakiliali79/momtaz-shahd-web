import { z } from "zod";

import { iranMobileSchema } from "@/lib/validation/phone";

/** Error messages are translation keys under `auth.errors`. */
export const loginSchema = z.object({
  phone: iranMobileSchema,
  password: z.string().min(1, "passwordRequired").max(128, "tooLong"),
});
export type LoginInput = z.input<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "nameRequired").max(80, "tooLong"),
    phone: iranMobileSchema,
    password: z
      .string()
      .min(8, "passwordTooShort")
      .max(128, "tooLong")
      .regex(/[A-Za-z]/, "passwordWeak")
      .regex(/\d/, "passwordWeak"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  });
export type RegisterInput = z.input<typeof registerSchema>;

export const authErrorKeys = [
  "invalidPhone",
  "passwordRequired",
  "passwordTooShort",
  "passwordWeak",
  "passwordMismatch",
  "nameRequired",
  "tooLong",
  "invalidCredentials",
  "phoneTaken",
  "server",
] as const;
export type AuthErrorKey = (typeof authErrorKeys)[number];

export function toAuthErrorKey(message: string | undefined): AuthErrorKey {
  return authErrorKeys.find((key) => key === message) ?? "server";
}

/**
 * Only allows same-site paths as a post-login destination, so a crafted
 * `callbackUrl` cannot send users to another site.
 */
export function safeCallbackUrl(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value.length <= 512 ? value : fallback;
}
