import { ProductCard } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CatalogProduct } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

/** 1 column on small phones → 2 → 3 → 4 → 5 on wide screens. */
export const productGridClass =
  "grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

/** Same progression, one step behind, for grids that sit next to the filter sidebar. */
export const productGridWithSidebarClass =
  "grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5";

export function ProductGrid({
  products,
  className = productGridClass,
}: {
  products: readonly CatalogProduct[];
  className?: string;
}) {
  return (
    <ul className={className}>
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-2/5" />
        <div className="flex items-end justify-between pt-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className = productGridClass,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn(className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
