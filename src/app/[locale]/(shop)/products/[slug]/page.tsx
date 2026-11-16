import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarClockIcon, ScaleIcon, TagsIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { Container } from "@/components/layout/container";
import { Gallery } from "@/components/product/gallery";
import { Price } from "@/components/product/price";
import { ProductGrid } from "@/components/product/product-grid";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { RatingStars } from "@/components/product/rating-stars";
import { ReviewFormGate } from "@/components/reviews/review-form-gate";
import { Breadcrumbs } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { toCartProduct } from "@/lib/cart";
import { getCatalog, getProductReviews } from "@/lib/data/catalog";
import { formatDate, formatNumber } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { PLACEHOLDER_IMAGE } from "@/lib/site";
import { discountPercent, formatWeight } from "@/lib/units";

export async function generateStaticParams() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return [];
  const { products } = await getCatalog(locale);
  return products.map((product) => ({ slug: product.slug }));
}

function summarize(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const [locale, { slug }] = await Promise.all([rootLocale(), params]);
  if (!hasLocale(routing.locales, locale)) return {};
  const { products } = await getCatalog(locale);
  const product = products.find((entry) => entry.slug === slug);
  if (!product) return {};

  const cover = product.images[0];
  return pageMetadata({
    locale,
    path: `/products/${product.slug}`,
    title: product.name,
    description: summarize(product.description),
    image: cover && cover !== PLACEHOLDER_IMAGE ? cover : undefined,
  });
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/products/[slug]">) {
  const [locale, { slug }] = await Promise.all([rootLocale(), params]);
  if (!hasLocale(routing.locales, locale)) notFound();

  const [t, catalog] = await Promise.all([getTranslations(), getCatalog(locale)]);
  const product = catalog.products.find((entry) => entry.slug === slug);
  if (!product) notFound();

  const reviews = await getProductReviews(product.id);
  const related = catalog.products
    .filter((entry) => entry.categorySlug === product.categorySlug && entry.id !== product.id)
    .slice(0, 5);
  const weight = formatWeight(product.weightGrams, locale);
  const outOfStock = product.stock <= 0;

  const facts = [
    {
      Icon: ScaleIcon,
      label: t("product.weight"),
      value: t(`units.${weight.unit}`, { value: weight.value }),
    },
    ...(product.shelfLifeDays
      ? [
          {
            Icon: CalendarClockIcon,
            label: t("product.shelfLife"),
            value: t("units.days", {
              count: product.shelfLifeDays,
              formatted: formatNumber(product.shelfLifeDays, locale),
            }),
          },
        ]
      : []),
    { Icon: TagsIcon, label: t("product.category"), value: product.categoryName },
  ];

  return (
    <Container className="page-y">
      <Breadcrumbs
        items={[
          { label: t("catalog.title"), href: "/products" },
          { label: product.categoryName, href: `/category/${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <Gallery images={product.images} name={product.name} dimmed={outOfStock} />

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/category/${product.categorySlug}`}
                className="touch-target rounded text-sm font-medium text-gold-ink hover:underline"
              >
                {product.categoryName}
              </Link>
              {outOfStock ? (
                <span className="rounded-full bg-foreground/85 px-2.5 py-0.5 text-xs font-medium text-background">
                  {t("product.outOfStock")}
                </span>
              ) : product.discountPrice !== null ? (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                  {t("product.discountBadge", {
                    percent: formatNumber(
                      discountPercent(product.price, product.discountPrice),
                      locale,
                    ),
                  })}
                </span>
              ) : null}
            </div>
            <h1 className="text-fluid-2xl font-bold text-balance">{product.name}</h1>
            <RatingStars
              rating={product.rating}
              reviewCount={product.reviewCount}
              className="text-sm"
            />
          </div>

          <Price price={product.price} discountPrice={product.discountPrice} size="lg" />

          <p className="max-w-prose leading-8 text-pretty text-muted-foreground">
            {product.description}
          </p>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.map(({ Icon, label, value }) => (
              <div key={label} className="rounded-2xl bg-muted/70 p-3.5">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <PurchasePanel product={toCartProduct(product)} />
        </div>
      </div>

      <Tabs defaultValue="description" className="mt-12 gap-6 sm:mt-16">
        <TabsList variant="line" className="h-auto! w-full justify-start gap-2 relative overflow-x-auto border-b border-border">
          <TabsTrigger value="description" className="flex-none px-4 py-3 text-base">
            {t("product.tabs.description")}
          </TabsTrigger>
          <TabsTrigger value="ingredients" className="flex-none px-4 py-3 text-base">
            {t("product.tabs.ingredients")}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex-none px-4 py-3 text-base">
            {t("product.tabs.reviews", { count: formatNumber(reviews.length, locale) })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="max-w-prose leading-8">
          <p>{product.description}</p>
          {product.shelfLifeDays ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("product.shelfLifeNote", {
                count: product.shelfLifeDays,
                formatted: formatNumber(product.shelfLifeDays, locale),
              })}
            </p>
          ) : null}
        </TabsContent>

        <TabsContent value="ingredients" className="max-w-prose leading-8">
          {product.ingredients ? (
            <p>{product.ingredients}</p>
          ) : (
            <p className="text-muted-foreground">{t("product.ingredientsEmpty")}</p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">{t("product.allergenNote")}</p>
        </TabsContent>

        <TabsContent value="reviews">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground">{t("product.reviewsEmpty")}</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p dir="auto" className="text-sm font-semibold">{review.author}</p>
                    <RatingStars rating={review.rating} showCount={false} />
                  </div>
                  {review.comment ? (
                    <p dir="auto" className="mt-3 text-sm leading-7">{review.comment}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-muted-foreground">
                    <time dateTime={review.createdAt}>{formatDate(review.createdAt, locale)}</time>
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6">
            {/* Who may review depends on the visitor: streams in after the static page. */}
            <Suspense fallback={null}>
              <ReviewFormGate productId={product.id} productSlug={product.slug} locale={locale} />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>

      {related.length > 0 ? (
        <section className="mt-14 sm:mt-20" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-6 text-fluid-lg font-bold">
            {t("product.related")}
          </h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </Container>
  );
}
