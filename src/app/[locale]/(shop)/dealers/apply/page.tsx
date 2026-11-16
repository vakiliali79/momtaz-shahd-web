import type { Metadata } from "next";
import { HandshakeIcon, MapIcon, MegaphoneIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { WholesaleRequestForm } from "@/components/wholesale/request-form";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations("dealerApply");
  return pageMetadata({ locale, path: "/dealers/apply", title: t("title"), description: t("lead") });
}

const perks = [
  { key: "listing", Icon: MapIcon },
  { key: "pricing", Icon: HandshakeIcon },
  { key: "marketing", Icon: MegaphoneIcon },
] as const;

export default async function DealerApplyPage() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const [t, tDealers] = await Promise.all([getTranslations("dealerApply"), getTranslations("dealers")]);

  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} crumbs={[{ label: tDealers("title"), href: "/dealers" }, { label: t("title") }]} />
      <Container className="grid gap-10 section-y-sm lg:grid-cols-[1fr_1.3fr] lg:gap-14">
        <div className="space-y-6">
          <h2 className="text-fluid-xl font-bold">{t("perksTitle")}</h2>
          <ul className="space-y-4">
            {perks.map(({ key, Icon }) => (
              <li key={key} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-gold-ink">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold">{t(`perks.${key}.title`)}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{t(`perks.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="rounded-2xl bg-muted/60 p-4 text-sm leading-7 text-muted-foreground">{t("process")}</p>
        </div>
        <section aria-labelledby="dealer-apply-form" className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
          <h2 id="dealer-apply-form" className="mb-6 text-fluid-lg font-bold">{t("formTitle")}</h2>
          <WholesaleRequestForm type="AGENCY" />
        </section>
      </Container>
    </>
  );
}
