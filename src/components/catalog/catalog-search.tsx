"use client";

import { useId, type FormEvent } from "react";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCatalogNavigation } from "@/components/catalog/use-catalog-navigation";
import { Input } from "@/components/ui/input";
import type { CatalogParams } from "@/lib/catalog-query";
import { cn } from "@/lib/utils";

export function CatalogSearch({
  params,
  className,
}: {
  params: CatalogParams;
  className?: string;
}) {
  const t = useTranslations("catalog");
  const id = useId();
  const { update } = useCatalogNavigation(params);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    update({ q: typeof value === "string" ? value.trim().slice(0, 100) : "" });
  }

  return (
    <form role="search" aria-label={t("searchLabel")} onSubmit={handleSubmit} className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {t("searchLabel")}
      </label>
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        // Re-mount when the URL query changes so the field mirrors it.
        key={params.q}
        id={id}
        name="q"
        type="search"
        defaultValue={params.q}
        maxLength={100}
        enterKeyHint="search"
        placeholder={t("searchPlaceholder")}
        className="h-11 rounded-full ps-10"
      />
    </form>
  );
}
