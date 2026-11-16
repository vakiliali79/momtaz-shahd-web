import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { DealerLocator } from "@/components/dealers/dealer-locator";
import { routing } from "@/i18n/routing";
import { getDealers } from "@/lib/data/catalog";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations("dealers");
  return pageMetadata({ locale, path: "/dealers", title: t("title"), description: t("lead") });
}

export default async function DealersPage() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const [t, dealers] = await Promise.all([getTranslations("dealers"), getDealers(locale)]);
  return <DealerLocator dealers={dealers} title={t("title")} lead={t("lead")} />;
}
