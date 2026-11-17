import type { AppLocale } from "@/i18n/routing";
import type { CatalogProduct, ProductReview } from "@/lib/data/catalog";
import { PLACEHOLDER_IMAGE, SITE_URL } from "@/lib/site";

/**
 * schema.org JSON-LD builders. Prices are stored in Toman, which has no ISO
 * currency code, so offers are given in Iranian rials (1 Toman = 10 IRR).
 */

const absolute = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

export function organizationJsonLd({ name, description, logo, phone, email, sameAs }: {
  name: string;
  description: string;
  logo: string;
  phone: string;
  email: string;
  sameAs: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name,
    description,
    url: SITE_URL,
    logo: absolute(logo),
    ...(phone || email
      ? { contactPoint: [{ "@type": "ContactPoint", contactType: "customer service", ...(phone ? { telephone: phone } : {}), ...(email ? { email } : {}), availableLanguage: ["fa", "en", "ar"] }] }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd(locale: AppLocale, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/${locale}#website`,
    name,
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/${locale}/products?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(product: CatalogProduct, locale: AppLocale, brand: string, reviews: ProductReview[]) {
  const url = `${SITE_URL}/${locale}/products/${product.slug}`;
  const images = product.images.filter((image) => image !== PLACEHOLDER_IMAGE).map(absolute);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url,
    name: product.name,
    description: product.description,
    sku: product.slug,
    url,
    ...(images.length ? { image: images } : {}),
    brand: { "@type": "Brand", name: brand },
    category: product.categoryName,
    weight: { "@type": "QuantitativeValue", value: product.weightGrams, unitCode: "GRM" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "IRR",
      price: product.effectivePrice * 10,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE_URL}/#organization` },
    },
    ...(product.rating !== null && product.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.toFixed(1), reviewCount: product.reviewCount, bestRating: 5, worstRating: 1 } }
      : {}),
    ...(reviews.length
      ? {
          review: reviews.slice(0, 5).map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.author },
            datePublished: review.createdAt.slice(0, 10),
            reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
            ...(review.comment ? { reviewBody: review.comment } : {}),
          })),
        }
      : {}),
  };
}
