"use client";

import { useId, type FormEvent } from "react";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ q: z.string().trim().min(1).max(100) });

export function SearchForm({
  className,
  onSearch,
}: {
  className?: string;
  /** Called after a valid search is submitted (e.g. to close the drawer). */
  onSearch?: () => void;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const id = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = searchSchema.safeParse({
      q: new FormData(event.currentTarget).get("q"),
    });
    if (!parsed.success) return;
    router.push({ pathname: "/products", query: { q: parsed.data.q } });
    onSearch?.();
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn("relative", className)}
    >
      <label htmlFor={id} className="sr-only">
        {t("label")}
      </label>
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={id}
        name="q"
        type="search"
        maxLength={100}
        enterKeyHint="search"
        placeholder={t("placeholder")}
        className="h-9 rounded-full bg-muted/60 ps-9"
      />
      <button type="submit" className="sr-only">
        {t("submit")}
      </button>
    </form>
  );
}
