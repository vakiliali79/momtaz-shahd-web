import { z } from "zod";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Converts Persian and Arabic-Indic digits to Latin digits. */
export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persian = PERSIAN_DIGITS.indexOf(digit);
    return String(persian >= 0 ? persian : ARABIC_DIGITS.indexOf(digit));
  });
}

/**
 * Normalises an Iranian mobile number to the stored form `09xxxxxxxxx`.
 * Accepts `+98 912 000 0000`, `0098912…`, `98912…`, `912…`, and Persian digits.
 * Returns the cleaned input unchanged when it is not a valid mobile number,
 * so that validation can report it.
 */
export function normalizeIranMobile(input: string): string {
  const digits = toLatinDigits(input).replace(/[\s\-()]/g, "");
  const match = /^(?:\+98|0098|98|0)?(9\d{9})$/.exec(digits);
  return match ? `0${match[1]}` : digits;
}

export const IRAN_MOBILE_REGEX = /^09\d{9}$/;

/** Zod schema: normalises, then requires a valid Iranian mobile number. */
export const iranMobileSchema = z
  .string()
  .transform(normalizeIranMobile)
  .pipe(z.string().regex(IRAN_MOBILE_REGEX, "invalidPhone"));
