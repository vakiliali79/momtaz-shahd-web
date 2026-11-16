"use client";

import type { ReactNode } from "react";
import { CircleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localeMeta } from "@/i18n/locales";
import { routing, type AppLocale } from "@/i18n/routing";

/**
 * One tab per language for multilingual fields. `render(locale)` returns the
 * fields of that language; `hasError(locale)` marks a tab that needs fixing.
 */
export function LocalizedTabs({
  render,
  hasError,
}: {
  render: (locale: AppLocale) => ReactNode;
  hasError: (locale: AppLocale) => boolean;
}) {
  const t = useTranslations("admin.form");
  return (
    <Tabs defaultValue={routing.defaultLocale} className="gap-4">
      <TabsList aria-label={t("languages")} className="h-11">
        {routing.locales.map((locale) => (
          <TabsTrigger key={locale} value={locale} className="gap-1.5 px-3" lang={locale}>
            {localeMeta[locale].nativeName}
            {hasError(locale) ? (
              <CircleAlertIcon className="size-3.5 text-destructive" role="img" aria-label={t("tabHasErrors")} />
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
      {routing.locales.map((locale) => (
        // Inactive tabs stay mounted so their inputs keep their values.
        <TabsContent key={locale} value={locale} forceMount className="space-y-4 data-[state=inactive]:hidden" dir={localeMeta[locale].dir} lang={locale}>
          {render(locale)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
