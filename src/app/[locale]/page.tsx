import { CookieIcon, LeafIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { getDirection, localeMeta } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { formatDate, formatPrice } from "@/lib/format";

// Placeholder catalogue with sample prices (Toman) until the product stage.
const sampleProducts = [
  { id: "walnut-koloocheh", key: "walnutKoloocheh", price: 185000 },
  { id: "plain-koloocheh", key: "plainKoloocheh", price: 145000 },
  { id: "date-kolompeh", key: "dateKolompeh", price: 210000 },
  { id: "coconut-koloocheh", key: "coconutKoloocheh", price: 165000 },
] as const;

const SAMPLE_PRICE = 1250000;
const SAMPLE_DATE = "2026-03-21T08:30:00Z"; // Nowruz, 1 Farvardin 1405

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const dir = getDirection(locale);
  const toman = t("common.toman");

  const checks = [
    { label: t("home.checkLanguage"), value: localeMeta[locale].nativeName },
    {
      label: t("home.checkDirection"),
      value: dir === "rtl" ? t("home.directionRtl") : t("home.directionLtr"),
    },
    { label: t("home.checkPrice"), value: formatPrice(SAMPLE_PRICE, locale, toman) },
    { label: t("home.checkDate"), value: formatDate(SAMPLE_DATE, locale) },
    {
      label: t("home.checkCalendar"),
      value: locale === "fa" ? t("home.calendarJalali") : t("home.calendarGregorian"),
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-linear-to-b from-secondary/70 to-background dark:from-secondary/40">
        <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:py-28">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs font-medium text-brand-leaf shadow-soft dark:text-success">
              <LeafIcon className="size-3.5" aria-hidden="true" />
              {t("home.eyebrow")}
            </p>
            <h1 className="text-fluid-display font-extrabold text-balance">
              {t("home.title")}
            </h1>
            <p className="max-w-xl text-fluid-base leading-relaxed text-pretty text-muted-foreground">
              {t("home.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 rounded-full px-6 text-base">
                <Link href="/products">{t("home.shopNow")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 rounded-full px-6 text-base"
              >
                <Link href="/wholesale">{t("home.wholesaleCta")}</Link>
              </Button>
            </div>
          </div>

          {/* Placeholder for hero product photography. */}
          <div
            aria-hidden="true"
            className="relative mx-auto grid aspect-square w-full max-w-md place-items-center rounded-[2.5rem] bg-linear-to-br from-brand-cream to-brand-gold/40 shadow-soft lg:max-w-none dark:from-secondary dark:to-brand-gold/25"
          >
            <CookieIcon className="size-2/5 text-brand-gold" strokeWidth={1} />
            <span className="absolute end-6 top-6 size-14 rounded-full bg-brand-red/90 shadow-soft" />
            <span className="absolute start-8 bottom-8 size-9 rounded-full bg-brand-leaf/90 shadow-soft" />
          </div>
        </Container>
      </section>

      <Container as="section" className="py-14 sm:py-20" aria-labelledby="products-title">
        <div className="mb-8 space-y-2">
          <h2 id="products-title" className="text-fluid-2xl font-bold">
            {t("home.productsTitle")}
          </h2>
          <p className="text-muted-foreground">{t("home.productsSubtitle")}</p>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-5">
          {sampleProducts.map(({ id, key, price }) => {
            const name = t(`home.products.${key}.name`);
            return (
              <li
                key={id}
                className="@container flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div
                  aria-hidden="true"
                  className="grid aspect-4/3 place-items-center bg-linear-to-br from-secondary to-muted"
                >
                  <CookieIcon className="size-14 text-brand-gold" strokeWidth={1.25} />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4 @xs:p-5">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{name}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t(`home.products.${key}.description`)}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <p className="font-bold text-primary">
                      {formatPrice(price, locale, toman)}
                    </p>
                    <AddToCartButton productId={id} productName={name} unitPrice={price} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>

      <Container as="section" className="pb-16 sm:pb-24" aria-labelledby="check-title">
        <div className="rounded-2xl border border-border bg-muted/50 p-5 sm:p-8">
          <h2 id="check-title" className="text-fluid-lg font-bold">
            {t("home.checkTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("home.checkSubtitle")}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {checks.map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-background p-4 shadow-soft">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </>
  );
}
