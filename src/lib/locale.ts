import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { routing, type AppLocale } from "@/i18n/routing";

/** The active locale from the URL, or a 404 for an unknown one. */
export async function currentLocale(): Promise<AppLocale> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  return locale;
}
