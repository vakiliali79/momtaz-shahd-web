import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { TrackForm } from "@/components/track/track-form";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations("track");
  return pageMetadata({ locale, path: "/track", title: t("title"), description: t("lead") });
}

export default async function TrackPage() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("track");
  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} crumbs={[{ label: t("title") }]} />
      <Container className="max-w-4xl py-10 sm:py-14">
        <TrackForm />
      </Container>
    </>
  );
}
