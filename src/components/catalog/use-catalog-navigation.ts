"use client";

import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { toCatalogQuery, type CatalogParams } from "@/lib/catalog-query";

/**
 * Updates catalogue filters in the URL. All filter state lives in the
 * search params, so results are shareable and survive a reload.
 */
export function useCatalogNavigation(params: CatalogParams) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function update(changes: Partial<CatalogParams>) {
    // Any filter change returns to the first page.
    const next = { ...params, page: 1, ...changes };
    startTransition(() => {
      router.replace({ pathname, query: toCatalogQuery(next) }, { scroll: false });
    });
  }

  function clear() {
    update({ category: [], min: undefined, max: undefined, stock: undefined, q: "" });
  }

  return { update, clear, isPending };
}
