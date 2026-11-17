import type { Metadata } from "next";
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  LeafIcon,
  MapPinIcon,
  QuoteIcon,
  SparklesIcon,
  StoreIcon,
  TruckIcon,
  WheatIcon,
} from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { FeaturedCarousel } from "@/components/home/featured-carousel";
import { HeroText, HeroVisual } from "@/components/home/hero-visual";
import { IranMap } from "@/components/home/iran-map";
import { Container } from "@/components/layout/container";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { ProductCard } from "@/components/product/product-card";
import { ProductImage } from "@/components/product/product-image";
import { RatingStars } from "@/components/product/rating-stars";
import { MotionCard } from "@/components/shared/motion-card";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getCatalog, getDealers, getTestimonials } from "@/lib/data/catalog";
import { getContactInfo } from "@/lib/data/settings";
import { resolveImage } from "@/lib/data/images";
import { formatNumber } from "@/lib/format";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  return { alternates: localeAlternates(locale) };
}

const values = [
  { key: "ingredients", Icon: WheatIcon },
  { key: "fresh", Icon: SparklesIcon },
  { key: "shipping", Icon: TruckIcon },
  { key: "dealers", Icon: StoreIcon },
] as const;

function SectionHeading({
  id,
  title,
  subtitle,
  action,
}: {
  id: string;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <h2 id={id} className="text-fluid-2xl font-bold text-balance">
          {title}
        </h2>
        {subtitle ? (
          <p className="max-w-2xl text-fluid-sm text-pretty text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ? (
        <Button asChild variant="ghost" size="lg" className="rounded-full px-4">
          <Link href={action.href}>
            {action.label}
            <ArrowLeftIcon className="ltr:rotate-180" aria-hidden="true" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  const [t, catalog, testimonials, dealers, contact] = await Promise.all([
    getTranslations(),
    getCatalog(locale),
    getTestimonials(locale),
    getDealers(locale),
    getContactInfo(),
  ]);
  const instagramUrl = `https://www.instagram.com/${contact.instagram || "momtaz_shahd"}`;

  const featured = catalog.products.filter((product) => product.isFeatured);
  const heroImage = resolveImage("/products/hero.jpg");
  const mapPoints = dealers.flatMap((dealer) =>
    dealer.lat !== null && dealer.lng !== null
      ? [{ id: dealer.id, lat: dealer.lat, lng: dealer.lng, label: dealer.name }]
      : [],
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-b from-secondary/80 to-background dark:from-secondary/40">
        <Container className="grid items-center gap-10 section-y-sm lg:grid-cols-2 lg:gap-16 lg:py-24">
          <HeroText>
            <p className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs font-medium text-leaf-ink shadow-soft">
              <LeafIcon className="size-3.5" aria-hidden="true" />
              {t("home.hero.eyebrow")}
            </p>
            <h1 className="text-fluid-display font-extrabold text-balance">
              {t("home.hero.title")}
            </h1>
            <p className="max-w-xl text-fluid-base leading-relaxed text-pretty text-muted-foreground">
              {t("home.hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
                <Link href="/products">{t("home.hero.shopNow")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
                <Link href="/wholesale">{t("home.hero.wholesale")}</Link>
              </Button>
            </div>
          </HeroText>
          <HeroVisual>
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-secondary shadow-soft">
              <ProductImage
                src={heroImage}
                alt={t("home.hero.imageAlt")}
                sizes="(min-width: 1024px) 45vw, 92vw"
                priority
              />
            </div>
          </HeroVisual>
        </Container>
      </section>

      {/* Categories */}
      <Container as="section" className="section-y" aria-labelledby="home-categories">
        <SectionHeading
          id="home-categories"
          title={t("home.categories.title")}
          subtitle={t("home.categories.subtitle")}
        />
        <ul className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {catalog.categories.map((category, index) => (
            <li key={category.id}>
              <Reveal delay={index * 0.06} className="h-full">
                <MotionCard className="h-full">
                <Link
                  href={`/category/${category.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow duration-300 hover:shadow-lg"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-secondary">
                    <ProductImage
                      src={category.image}
                      alt=""
                      sizes="(min-width: 1024px) 23vw, 46vw"
                      className="transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("home.categories.count", {
                        count: category.productCount,
                        formatted: formatNumber(category.productCount, locale),
                      })}
                    </p>
                  </div>
                </Link>
                </MotionCard>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>

      {/* Featured products */}
      {featured.length > 0 ? (
        <section className="bg-muted/50 section-y" aria-labelledby="home-featured">
          <Container>
            <SectionHeading
              id="home-featured"
              title={t("home.featured.title")}
              subtitle={t("home.featured.subtitle")}
              action={{ href: "/products", label: t("home.featured.viewAll") }}
            />
            <FeaturedCarousel label={t("home.featured.carousel")}>
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </FeaturedCarousel>
          </Container>
        </section>
      ) : null}

      {/* Why Momtaz Shahd */}
      <Container as="section" className="section-y" aria-labelledby="home-why">
        <SectionHeading id="home-why" title={t("home.why.title")} subtitle={t("home.why.subtitle")} />
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {values.map(({ key, Icon }, index) => (
            <li key={key}>
              <Reveal delay={index * 0.06} className="h-full">
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-gold-ink">
                    <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold">{t(`home.why.${key}.title`)}</h3>
                  <p className="mt-1.5 text-sm leading-7 text-muted-foreground">
                    {t(`home.why.${key}.text`)}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>

      {/* Testimonials */}
      {testimonials.length > 0 ? (
        <section className="bg-secondary/50 section-y dark:bg-secondary/25" aria-labelledby="home-testimonials">
          <Container>
            <SectionHeading
              id="home-testimonials"
              title={t("home.testimonials.title")}
              subtitle={t("home.testimonials.subtitle")}
            />
            <ul className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {testimonials.map((review, index) => (
                <li key={review.id}>
                  <Reveal delay={(index % 3) * 0.06} className="h-full">
                    <figure className="flex h-full flex-col rounded-2xl bg-card p-6 shadow-soft">
                      <QuoteIcon className="size-6 text-gold-ink/70 rtl:-scale-x-100" aria-hidden="true" />
                      {/* Reviews are stored in the language the customer wrote them in. */}
                      <blockquote dir="auto" className="mt-3 flex-1 text-sm leading-7">
                        {review.comment}
                      </blockquote>
                      <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                        <div>
                          <p dir="auto" className="text-sm font-semibold">{review.author}</p>
                          <Link
                            href={`/products/${review.productSlug}`}
                            className="touch-target text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                          >
                            {review.productName}
                          </Link>
                        </div>
                        <RatingStars rating={review.rating} showCount={false} />
                      </figcaption>
                    </figure>
                  </Reveal>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* Dealer locator teaser */}
      <Container as="section" className="section-y" aria-labelledby="home-dealers">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-5">
            <h2 id="home-dealers" className="text-fluid-2xl font-bold text-balance">
              {t("home.dealers.title")}
            </h2>
            <p className="text-fluid-sm leading-relaxed text-pretty text-muted-foreground">
              {t("home.dealers.subtitle")}
            </p>
            <ul className="grid gap-2.5 text-sm sm:grid-cols-2">
              {dealers.slice(0, 6).map((dealer) => (
                <li key={dealer.id} className="flex items-center gap-2">
                  <MapPinIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate">{dealer.name}</span>
                  {dealer.isVerified ? (
                    <BadgeCheckIcon
                      className="size-4 shrink-0 text-leaf-ink"
                      role="img"
                      aria-label={t("home.dealers.verified")}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="h-11 rounded-full px-6">
              <Link href="/dealers">{t("home.dealers.cta")}</Link>
            </Button>
          </div>
          <Reveal>
            <IranMap
              points={mapPoints}
              label={t("home.dealers.mapLabel", {
                count: mapPoints.length,
                formatted: formatNumber(mapPoints.length, locale),
              })}
              className="mx-auto max-w-md"
            />
          </Reveal>
        </div>
      </Container>

      {/* Instagram placeholder */}
      <section className="bg-muted/50 section-y" aria-labelledby="home-instagram">
        <Container>
          <SectionHeading
            id="home-instagram"
            title={t("home.instagram.title")}
            subtitle={t("home.instagram.subtitle")}
          />
          {/* Placeholder tiles until the Instagram feed is connected. */}
          <ul className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, index) => (
              <li key={index} className={index >= 3 ? "max-lg:hidden" : undefined}>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("footer.instagram")}
                  className="group relative block aspect-square overflow-hidden rounded-2xl bg-secondary"
                >
                  <ProductImage
                    src={resolveImage(`/instagram/${index + 1}.jpg`)}
                    alt=""
                    sizes="(min-width: 1024px) 15vw, 30vw"
                    className="transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                  />
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 text-center">
            <Button asChild variant="outline" size="lg" className="h-11 rounded-full px-6">
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                <span dir="ltr">@{contact.instagram || "momtaz_shahd"}</span>
                <span>{t("home.instagram.cta")}</span>
              </a>
            </Button>
          </div>
        </Container>
      </section>

      {/* Newsletter */}
      <Container as="section" className="section-y" aria-labelledby="home-newsletter">
        <div className="rounded-3xl bg-brand-red px-6 py-10 text-white sm:px-12 sm:py-14">
          <div className="mx-auto max-w-xl space-y-5 text-center">
            <h2 id="home-newsletter" className="text-fluid-2xl font-bold text-balance">
              {t("home.newsletter.title")}
            </h2>
            <p className="text-fluid-sm text-pretty opacity-90">{t("home.newsletter.subtitle")}</p>
            <div className="mx-auto max-w-md text-start [&_[role=alert]]:text-white [&_button]:bg-foreground [&_button]:text-background [&_button]:hover:bg-foreground/85 [&_input]:text-foreground">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
