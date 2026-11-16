import { useLocale, useTranslations } from "next-intl";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { Price } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { RatingStars } from "@/components/product/rating-stars";
import { WishlistButton } from "@/components/product/wishlist-button";
import { MotionCard } from "@/components/shared/motion-card";
import { Link } from "@/i18n/navigation";
import { toCartProduct } from "@/lib/cart";
import type { CatalogProduct } from "@/lib/data/catalog";
import { formatNumber } from "@/lib/format";
import { discountPercent, formatWeight } from "@/lib/units";
import { cn } from "@/lib/utils";

export const CARD_IMAGE_SIZES =
  "(min-width: 1536px) 18vw, (min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 420px) 46vw, 92vw";

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: CatalogProduct;
  priority?: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const weight = formatWeight(product.weightGrams, locale);
  const outOfStock = product.stock <= 0;

  return (
    <MotionCard
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow duration-300 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <ProductImage
          src={product.images[0] ?? ""}
          alt=""
          sizes={CARD_IMAGE_SIZES}
          priority={priority}
          className={cn(
            "transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
            outOfStock && "opacity-50 grayscale",
          )}
        />
        <div className="pointer-events-none absolute start-3 top-3 flex flex-col items-start gap-1.5">
          {outOfStock ? (
            <span className="rounded-full bg-foreground/85 px-2.5 py-1 text-xs font-medium text-background">
              {t("product.outOfStock")}
            </span>
          ) : product.discountPrice !== null ? (
            <span className="rounded-full bg-brand-red px-2.5 py-1 text-xs font-semibold text-white">
              {t("product.discountBadge", {
                percent: formatNumber(
                  discountPercent(product.price, product.discountPrice),
                  locale,
                ),
              })}
            </span>
          ) : null}
        </div>
        <WishlistButton
          productId={product.id}
          productName={product.name}
          className="absolute end-3 top-3 z-10"
        />
      </div>

      {/* Sized by the card's own width (container query), not the viewport. */}
      <div className="@container flex flex-1 flex-col gap-2 p-3 @[15rem]:p-4">
        <h3 className="text-sm leading-snug font-semibold @[15rem]:text-base">
          {/* The link's ::after covers the whole card, making all of it clickable. */}
          <Link
            href={`/products/${product.slug}`}
            className="rounded outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline-2 focus-visible:after:outline-ring"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">
          {t(`units.${weight.unit}`, { value: weight.value })}
        </p>
        <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
          <Price price={product.price} discountPrice={product.discountPrice} />
          <AddToCartButton
            variant="icon"
            product={toCartProduct(product)}
            className="relative z-10"
          />
        </div>
      </div>
    </MotionCard>
  );
}
