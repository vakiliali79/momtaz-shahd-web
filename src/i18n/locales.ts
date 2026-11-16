import type { AppLocale } from "./routing";

export type Direction = "rtl" | "ltr";

type LocaleMeta = {
  /** Text direction of the locale. */
  dir: Direction;
  /** Language name written in that language (never translated). */
  nativeName: string;
  /** BCP 47 tag used for number formatting (locale-aware digits). */
  numberLocale: string;
  /** BCP 47 tag used for date formatting (calendar + digits). */
  dateLocale: string;
};

export const localeMeta: Record<AppLocale, LocaleMeta> = {
  fa: {
    dir: "rtl",
    nativeName: "فارسی",
    numberLocale: "fa-IR-u-nu-arabext",
    dateLocale: "fa-IR-u-ca-persian-nu-arabext",
  },
  en: {
    dir: "ltr",
    nativeName: "English",
    numberLocale: "en-US-u-nu-latn",
    dateLocale: "en-US-u-ca-gregory-nu-latn",
  },
  ar: {
    dir: "rtl",
    nativeName: "العربية",
    numberLocale: "ar-u-nu-arab",
    dateLocale: "ar-u-ca-gregory-nu-arab",
  },
};

export function getDirection(locale: AppLocale): Direction {
  return localeMeta[locale].dir;
}
