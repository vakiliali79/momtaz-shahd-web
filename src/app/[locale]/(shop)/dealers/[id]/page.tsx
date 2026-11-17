import type { Metadata } from "next";
import { BadgeCheckIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { DealerDetails } from "@/components/dealers/dealer-details";
import { DealerMiniMap } from "@/components/dealers/dealer-mini-map";
import { Container } from "@/components/layout/container";
import { ProductImage } from "@/components/product/product-image";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getDealer, getDealers } from "@/lib/data/catalog";
import { resolveImage } from "@/lib/data/images";
import { SITE_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  // Pre-render every dealer in the default language; others render on demand.
  const dealers = await getDealers(routing.defaultLocale);
  return dealers.map((dealer) => ({ id: dealer.id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/dealers/[id]">): Promise<Metadata> {
  const [locale, { id }] = await Promise.all([rootLocale(), params]);
  if (!hasLocale(routing.locales, locale)) return {};
  const [t, dealer] = await Promise.all([getTranslations("dealers"), getDealer(id, locale)]);
  if (!dealer) return {};
  return pageMetadata({
    locale,
    path: `/dealers/${dealer.id}`,
    title: t("detailTitle", { name: dealer.name, city: dealer.city }),
    description: t("detailDescription", { name: dealer.name, type: t(`types.${dealer.type}`), city: dealer.city, address: dealer.address }),
    image: dealer.image ?? undefined,
  });
}

const schemaType = { DISTRIBUTOR: "WholesaleStore", RETAIL_STORE: "Store", AGENCY: "Store" } as const;

export default async function DealerPage({ params }: PageProps<"/[locale]/dealers/[id]">) {
  const [locale, { id }] = await Promise.all([rootLocale(), params]);
  if (!hasLocale(routing.locales, locale)) notFound();
  const [t, tBrand, dealer] = await Promise.all([getTranslations("dealers"), getTranslations("brand"), getDealer(id, locale)]);
  if (!dealer) notFound();

  const url = `${SITE_URL}/${locale}/dealers/${dealer.id}`;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType[dealer.type],
    "@id": url,
    name: dealer.name,
    url,
    description: t("detailDescription", { name: dealer.name, type: t(`types.${dealer.type}`), city: dealer.city, address: dealer.address }),
    address: {
      "@type": "PostalAddress",
      streetAddress: dealer.address,
      addressLocality: dealer.city,
      addressRegion: dealer.province,
      addressCountry: "IR",
    },
    brand: { "@type": "Brand", name: tBrand("name") },
    ...(dealer.phone ? { telephone: dealer.phone } : {}),
    ...(dealer.image ? { image: dealer.image.startsWith("http") ? dealer.image : `${SITE_URL}${dealer.image}` } : {}),
    ...(dealer.lat !== null && dealer.lng !== null ? { geo: { "@type": "GeoCoordinates", latitude: dealer.lat, longitude: dealer.lng } } : {}),
    ...(dealer.instagram ? { sameAs: [`https://www.instagram.com/${dealer.instagram}`] } : {}),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHeader
        title={dealer.name}
        description={`${t(`types.${dealer.type}`)} · ${t("place", { city: dealer.city, province: dealer.province })}`}
        crumbs={[{ label: t("title"), href: "/dealers" }, { label: dealer.name }]}
      />
      <Container className="grid gap-8 section-y-sm lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        <div className="space-y-6">
          {dealer.isVerified ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-leaf/15 px-3 py-1 text-sm font-medium text-leaf-ink">
              <BadgeCheckIcon className="size-4" aria-hidden="true" />
              {t("verifiedDealer")}
            </p>
          ) : null}
          {dealer.image ? (
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-secondary shadow-soft">
              <ProductImage src={resolveImage(dealer.image)} alt={t("photoAlt", { name: dealer.name })} sizes="(min-width: 1440px) 560px, (min-width: 1024px) 40vw, 92vw" priority />
            </div>
          ) : null}
          <section aria-labelledby="dealer-contact" className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
            <h2 id="dealer-contact" className="mb-4 font-semibold">{t("contactTitle")}</h2>
            <DealerDetails dealer={dealer} />
          </section>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dealers">{t("backToMap")}</Link>
          </Button>
        </div>
        {dealer.lat !== null && dealer.lng !== null ? (
          <div className="h-80 overflow-hidden rounded-3xl border border-border shadow-soft lg:h-auto lg:min-h-[28rem]">
            <DealerMiniMap dealer={dealer} />
          </div>
        ) : null}
      </Container>
    </>
  );
}
