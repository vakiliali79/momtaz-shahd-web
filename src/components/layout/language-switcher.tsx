"use client";

import { useTransition } from "react";
import { ChevronDownIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { FlagIcon } from "@/components/layout/flag-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localeMeta } from "@/i18n/locales";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function isAppLocale(value: string): value is AppLocale {
  return routing.locales.some((locale) => locale === value);
}

export function LanguageSwitcher({
  showName = false,
  className,
}: {
  /** Show the language name next to the flag (used where space allows). */
  showName?: boolean;
  className?: string;
}) {
  const t = useTranslations("language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: string) {
    if (!isAppLocale(next) || next === locale) return;
    // Keep the current path, query string and hash; only the locale changes.
    const { search, hash } = window.location;
    startTransition(() => {
      router.replace(`${pathname}${search}${hash}`, { locale: next });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showName ? "lg" : "icon-lg"}
          aria-label={`${t("label")} — ${t("current", { language: localeMeta[locale].nativeName })}`}
          disabled={isPending}
          className={cn(showName && "justify-start gap-2 px-2", className)}
        >
          <FlagIcon locale={locale} />
          {showName ? (
            <>
              <span>{localeMeta[locale].nativeName}</span>
              <ChevronDownIcon className="ms-auto opacity-60" aria-hidden="true" />
            </>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup value={locale} onValueChange={switchTo}>
          {routing.locales.map((code) => (
            <DropdownMenuRadioItem
              key={code}
              value={code}
              lang={code}
              dir={localeMeta[code].dir}
              className="gap-2"
            >
              <FlagIcon locale={code} />
              <span>{localeMeta[code].nativeName}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
