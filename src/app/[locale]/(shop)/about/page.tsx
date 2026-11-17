import type { Metadata } from "next";
import { HeartHandshakeIcon, SparklesIcon, WheatIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { Container } from "@/components/layout/container";
import { ProductImage } from "@/components/product/product-image";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveImage } from "@/lib/data/images";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations("about");
  return pageMetadata({
    locale,
    path: "/about",
    title: t("title"),
    description: t("lead"),
  });
}

const principles = [
  { key: "ingredients", Icon: WheatIcon },
  { key: "craft", Icon: SparklesIcon },
  { key: "trust", Icon: HeartHandshakeIcon },
] as const;

export default async function AboutPage() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("about");

  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} crumbs={[{ label: t("title") }]} />

      <Container className="grid items-center gap-10 section-y-sm lg:grid-cols-2 lg:gap-16">
        <div className="space-y-5">
          <h2 className="text-fluid-2xl font-bold text-balance">{t("story.title")}</h2>
          <p className="leading-8 text-pretty text-muted-foreground">{t("story.p1")}</p>
          <p className="leading-8 text-pretty text-muted-foreground">{t("story.p2")}</p>
        </div>
        <Reveal>
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-secondary shadow-soft">
            <ProductImage
              src={resolveImage("/about/bakery.jpg")}
              alt={t("story.imageAlt")}
              sizes="(min-width: 1024px) 45vw, 92vw"
            />
          </div>
        </Reveal>
      </Container>

      <section className="bg-muted/50 section-y-sm" aria-labelledby="about-principles">
        <Container>
          <h2 id="about-principles" className="mb-8 text-fluid-2xl font-bold">
            {t("principles.title")}
          </h2>
          <ul className="grid gap-4 sm:gap-5 md:grid-cols-3">
            {principles.map(({ key, Icon }, index) => (
              <li key={key}>
                <Reveal delay={index * 0.06} className="h-full">
                  <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                    <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-gold-ink">
                      <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-semibold">{t(`principles.${key}.title`)}</h3>
                    <p className="mt-1.5 text-sm leading-7 text-muted-foreground">
                      {t(`principles.${key}.text`)}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="py-12 text-center sm:py-16">
        <h2 className="text-fluid-2xl font-bold text-balance">{t("cta.title")}</h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">{t("cta.text")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
            <Link href="/products">{t("cta.products")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
            <Link href="/contact">{t("cta.contact")}</Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
