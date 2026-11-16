import { z } from "zod";

import { routing } from "@/i18n/routing";

/** Error messages are translation keys under `admin.errors`. */
export const adminErrorKeys = [
  "required",
  "invalid",
  "tooLong",
  "slugInvalid",
  "slugTaken",
  "codeTaken",
  "mustBePositive",
  "mustBeWhole",
  "discountTooHigh",
  "percentRange",
  "wholesaleIncomplete",
  "invalidPhone",
  "invalidUrl",
  "invalidMessage",
  "placeholdersChanged",
  "notFound",
  "inUse",
  "forbidden",
  "server",
] as const;
export type AdminErrorKey = (typeof adminErrorKeys)[number];

export function toAdminErrorKey(message: string | undefined): AdminErrorKey {
  return adminErrorKeys.find((key) => key === message) ?? "invalid";
}

/** Result type of admin server actions. */
export type AdminResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: AdminErrorKey; field?: string };

export function firstIssue(issues: readonly { message: string; path: PropertyKey[] }[]) {
  const issue = issues[0];
  return {
    ok: false as const,
    error: toAdminErrorKey(issue?.message),
    field: issue ? issue.path.filter((part) => typeof part === "string" || typeof part === "number").join(".") : undefined,
  };
}

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "required")
  .max(80, "tooLong")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slugInvalid");

export const money = z.number({ error: "required" }).int("mustBeWhole").min(0, "mustBePositive").max(10_000_000_000, "tooLong");
export const optionalMoney = money.nullable();
export const count = z.number({ error: "required" }).int("mustBeWhole").min(0, "mustBePositive").max(10_000_000, "tooLong");

/** A required text in every language. */
export function localizedRequired(max: number) {
  const text = z.string().trim().min(1, "required").max(max, "tooLong");
  return z.object({ fa: text, en: text, ar: text });
}

/** Optional per language (empty strings allowed; Persian falls back on display). */
export function localizedOptional(max: number) {
  const text = z.string().trim().max(max, "tooLong");
  return z.object({ fa: text, en: text, ar: text });
}

export const emptyLocalized = () =>
  Object.fromEntries(routing.locales.map((locale) => [locale, ""])) as Record<(typeof routing.locales)[number], string>;

export const imageUrlSchema = z
  .string()
  .max(500)
  .regex(/^(\/uploads\/|\/products\/|\/categories\/|https:\/\/)/, "invalidUrl");
