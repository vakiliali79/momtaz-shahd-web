import type { Metadata } from "next";
import { BadgePercentIcon, FileTextIcon, HeadsetIcon, PackageIcon, StoreIcon, TruckIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { Container } from "@/components/layout/container";
import { Faq } from "@/components/shared/faq";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { WholesaleRequestForm } from "@/components/wholesale/request-form";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getCatalog } from "@/lib/data/catalog";
import { formatNumber, formatPrice } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations("wholesalePage");
  return pageMetadata({ locale, path: "/wholesale", title: t("title"), description: t("lead") });
}

const terms = ["minimum", "payment", "delivery"] as const;
const benefits = [
  { key: "prices", Icon: BadgePercentIcon },
  { key: "fresh", Icon: PackageIcon },
  { key: "shipping", Icon: TruckIcon },
  { key: "invoice", Icon: FileTextIcon },
  { key: "support", Icon: HeadsetIcon },
  { key: "display", Icon: StoreIcon },
] as const;
const faqKeys = ["who", "minimum", "prices", "payment", "delivery", "samples", "dealer"] as const;

export default async function WholesalePage() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const [t, tCommon, catalog] = await Promise.all([getTranslations("wholesalePage"), getTranslations("common"), getCatalog(locale)]);
  const toman = tCommon("toman");
  const tiers = catalog.products
    .filter((product) => product.wholesalePrice !== null && product.minWholesaleQty !== null && product.wholesalePrice < product.effectivePrice)
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName, locale) || a.name.localeCompare(b.name, locale));

  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} crumbs={[{ label: t("title") }]} />

      <Container className="grid gap-8 section-y-sm lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-14">
        <div className="space-y-5">
          <h2 className="text-fluid-2xl font-bold text-balance">{t("hero.title")}</h2>
          <p className="leading-8 text-pretty text-muted-foreground">{t("hero.text")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
              <a href="#request">{t("hero.cta")}</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
              <Link href="/dealers/apply">{t("hero.dealer")}</Link>
            </Button>
          </div>
        </div>
        <Reveal>
          <div className="grid gap-3 rounded-3xl border border-border bg-secondary/60 p-5 sm:p-7">
            <h3 className="font-semibold">{t("terms.title")}</h3>
            <dl className="grid gap-3">
            {terms.map((key) => (
              <div key={key} className="rounded-2xl bg-card p-4 shadow-soft">
                <dt className="text-sm text-muted-foreground">{t(`terms.${key}.label`)}</dt>
                <dd className="mt-1 font-semibold">{t(`terms.${key}.value`)}</dd>
              </div>
            ))}
            </dl>
          </div>
        </Reveal>
      </Container>

      <section className="bg-muted/50 section-y-sm" aria-labelledby="wholesale-benefits">
        <Container>
          <h2 id="wholesale-benefits" className="mb-8 text-fluid-2xl font-bold">{t("benefits.title")}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ key, Icon }, index) => (
              <li key={key}>
                <Reveal delay={index * 0.05} className="h-full">
                  <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-gold-ink">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{t(`benefits.${key}.title`)}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{t(`benefits.${key}.text`)}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container as="section" className="section-y-sm" aria-labelledby="wholesale-tiers">
        <h2 id="wholesale-tiers" className="text-fluid-2xl font-bold">{t("tiers.title")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("tiers.text")}</p>
        {tiers.length === 0 ? (
          <p className="mt-6 text-muted-foreground">{t("tiers.empty")}</p>
        ) : (
          <div className="mt-6 relative overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full min-w-[36rem] text-sm">
              <caption className="sr-only">{t("tiers.title")}</caption>
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3 text-start font-medium">{t("tiers.product")}</th>
                  <th scope="col" className="p-3 text-start font-medium">{t("tiers.retail")}</th>
                  <th scope="col" className="p-3 text-start font-medium">{t("tiers.wholesale")}</th>
                  <th scope="col" className="p-3 text-start font-medium">{t("tiers.minimum")}</th>
                  <th scope="col" className="p-3 text-end font-medium">{t("tiers.saving")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tiers.map((product) => {
                  const wholesale = product.wholesalePrice ?? product.effectivePrice;
                  const saving = Math.round((1 - wholesale / product.effectivePrice) * 100);
                  return (
                    <tr key={product.id}>
                      <th scope="row" className="p-3 text-start font-medium">
                        <Link href={`/products/${product.slug}`} className="touch-target hover:text-primary">{product.name}</Link>
                        <span className="block text-xs font-normal text-muted-foreground">{product.categoryName}</span>
                      </th>
                      <td className="p-3 whitespace-nowrap">{formatPrice(product.effectivePrice, locale, toman)}</td>
                      <td className="p-3 font-semibold whitespace-nowrap text-primary">{formatPrice(wholesale, locale, toman)}</td>
                      <td className="p-3 whitespace-nowrap">{t("tiers.units", { count: product.minWholesaleQty ?? 0, formatted: formatNumber(product.minWholesaleQty ?? 0, locale) })}</td>
                      <td className="p-3 text-end whitespace-nowrap">
                        <span className="rounded-full bg-brand-leaf/15 px-2.5 py-0.5 text-xs font-semibold text-leaf-ink">
                          {t("tiers.percent", { value: formatNumber(saving, locale) })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{t("tiers.note")}</p>
      </Container>

      <Container as="section" className="grid gap-10 pb-[clamp(2rem,1.6rem+2vw,4rem)] lg:grid-cols-[1fr_1.2fr] lg:gap-14" aria-labelledby="wholesale-faq">
        <div>
          <h2 id="wholesale-faq" className="mb-6 text-fluid-2xl font-bold">{t("faq.title")}</h2>
          <Faq items={faqKeys.map((key) => ({ question: t(`faq.${key}.q`), answer: t(`faq.${key}.a`) }))} />
        </div>
        <section id="request" aria-labelledby="wholesale-request" className="scroll-mt-24 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
          <h2 id="wholesale-request" className="text-fluid-lg font-bold">{t("form.title")}</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">{t("form.text")}</p>
          <WholesaleRequestForm type="WHOLESALE" />
        </section>
      </Container>
    </>
  );
}
