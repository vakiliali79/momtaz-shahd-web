import { localeMeta } from "@/i18n/locales";
import type { AppLocale } from "@/i18n/routing";

/**
 * Formats a number with locale-aware digits and thousands separators:
 * Persian digits for `fa`, Arabic-Indic for `ar`, Latin for `en`.
 */
export function formatNumber(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(localeMeta[locale].numberLocale, {
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats a Toman amount for display, e.g. `۱۸۵٬۰۰۰`, `185,000`, `١٨٥٬٠٠٠`.
 *
 * Pass the translated currency name as `unit` (e.g. `t("common.toman")`) to
 * get `۱۸۵٬۰۰۰ تومان` / `185,000 Toman`. The unit is not hardcoded here so that
 * all user-facing text stays in the next-intl message files.
 */
export function formatPrice(
  amount: number,
  locale: AppLocale,
  unit?: string,
): string {
  const formatted = formatNumber(Math.round(amount), locale);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Formats a date in the calendar of the locale: Jalali (Solar Hijri) for
 * `fa`, Gregorian for `en` and `ar`. Dates are shown in Tehran time.
 */
export function formatDate(
  date: Date | string | number,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" },
): string {
  return new Intl.DateTimeFormat(localeMeta[locale].dateLocale, {
    timeZone: "Asia/Tehran",
    ...options,
  }).format(new Date(date));
}
