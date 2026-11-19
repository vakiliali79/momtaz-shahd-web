import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { Container } from "@/components/layout/container";
import { ProductImage } from "@/components/product/product-image";
import { PageHeader } from "@/components/shared/page-header";
import { routing } from "@/i18n/routing";
import { IMAGE_CREDITS } from "@/lib/image-credits";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations("credits");
  return { ...pageMetadata({ locale, path: "/credits", title: t("title"), description: t("lead") }), robots: { index: false } };
}

const linkClass = "rounded underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary";

/** Attribution required by the CC BY / CC BY-SA licences of the temporary photos. */
export default async function CreditsPage() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("credits");

  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} crumbs={[{ label: t("title") }]} />
      <Container className="section-y-sm">
        <p className="mb-6 text-sm text-muted-foreground">{t("modified")}</p>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {IMAGE_CREDITS.map((credit) => (
            <li key={credit.image} className="flex gap-4 rounded-2xl border bg-card p-3 shadow-soft">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                <ProductImage src={credit.image} alt="" sizes="80px" />
              </div>
              <div className="min-w-0 space-y-1 text-sm">
                <p className="line-clamp-2 font-medium break-words" dir="auto">
                  {credit.title}
                </p>
                <p className="text-muted-foreground">
                  {credit.creatorUrl ? (
                    <a href={credit.creatorUrl} className={linkClass} rel="noopener noreferrer" dir="auto">
                      {t("by", { creator: credit.creator })}
                    </a>
                  ) : (
                    <span dir="auto">{t("by", { creator: credit.creator })}</span>
                  )}
                </p>
                <p className="flex flex-wrap gap-x-3 text-muted-foreground">
                  <a href={credit.licenseUrl} className={linkClass} rel="license noopener noreferrer">
                    {t("license", { license: credit.license })}
                  </a>
                  <a href={credit.sourceUrl} className={linkClass} rel="noopener noreferrer">
                    {t("source")}
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
