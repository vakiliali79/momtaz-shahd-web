import { z } from "zod";

import { routing, type AppLocale } from "@/i18n/routing";

/**
 * Multilingual content as stored in the database's JSON columns,
 * e.g. `Product.name = { fa: "کلوچه گردویی", en: "Walnut koloocheh", ar: "…" }`.
 */
export type LocalizedText = Record<AppLocale, string>;

/** All three languages required (names, titles). */
export const localizedTextSchema = z.object({
  fa: z.string().trim().min(1),
  en: z.string().trim().min(1),
  ar: z.string().trim().min(1),
});

/** Persian required, other languages may be left empty (long descriptions). */
export const localizedTextOptionalSchema = z.object({
  fa: z.string().trim().min(1),
  en: z.string().trim().default(""),
  ar: z.string().trim().default(""),
});

/**
 * Reads a localized JSON value for the given locale. Falls back to the
 * default locale (fa), then to any non-empty language, then to "".
 * Accepts `unknown` because Prisma types JSON columns loosely.
 */
export function localize(value: unknown, locale: AppLocale): string {
  if (typeof value !== "object" || value === null) return "";
  const record = value as Partial<Record<string, unknown>>;
  const candidates = [locale, routing.defaultLocale, ...routing.locales];
  for (const candidate of candidates) {
    const text = record[candidate];
    if (typeof text === "string" && text.trim() !== "") return text;
  }
  return "";
}
