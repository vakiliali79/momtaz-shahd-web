import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { RetryButton } from "@/components/pwa/retry-button";
import { StatusPage } from "@/components/shared/status-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offline");
  return { title: t("title"), robots: { index: false } };
}

/** Shown by the service worker when a page can't load without a connection. */
export default async function OfflinePage() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("offline");
  return (
    <StatusPage
      variant="error"
      title={t("title")}
      description={t("description")}
      actions={
        <>
          <RetryButton label={t("retry")} />
          <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6">
            <Link href="/cart">{t("cart")}</Link>
          </Button>
        </>
      }
    />
  );
}
