import type { AppLocale } from "@/i18n/routing";
import { localeMeta } from "@/i18n/locales";

/** Splits a weight into a localized number and its unit key ("g" | "kg"). */
export function formatWeight(
  grams: number,
  locale: AppLocale,
): { value: string; unit: "g" | "kg" } {
  const format = (value: number) =>
    new Intl.NumberFormat(localeMeta[locale].numberLocale, {
      maximumFractionDigits: 1,
    }).format(value);

  return grams >= 1000
    ? { value: format(grams / 1000), unit: "kg" }
    : { value: format(grams), unit: "g" };
}

export function discountPercent(price: number, discountPrice: number): number {
  return Math.round(((price - discountPrice) / price) * 100);
}
