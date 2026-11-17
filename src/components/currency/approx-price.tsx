"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { localeMeta } from "@/i18n/locales";
import { cn } from "@/lib/utils";

export type ApproxRates = { USD: number; AED: number };

const RatesContext = createContext<ApproxRates | null>(null);

/**
 * Admin-set exchange rates for the English and Arabic storefront. The shop
 * layout passes null for Persian or when approximate prices are switched off.
 */
export function ApproxRatesProvider({ rates, children }: { rates: ApproxRates | null; children: ReactNode }) {
  return <RatesContext.Provider value={rates}>{children}</RatesContext.Provider>;
}

/** "≈ $12.50 · ≈ AED 45.90" under a Toman amount, when rates are configured. */
export function ApproxPrice({ amount, className }: { amount: number; className?: string }) {
  const rates = useContext(RatesContext);
  const locale = useLocale();
  const t = useTranslations("currency");
  if (!rates || amount <= 0) return null;
  const parts = (["USD", "AED"] as const).flatMap((code) =>
    rates[code] > 0
      ? [
          new Intl.NumberFormat(localeMeta[locale].numberLocale, {
            style: "currency",
            currency: code,
            maximumFractionDigits: amount / rates[code] >= 100 ? 0 : 2,
          }).format(amount / rates[code]),
        ]
      : [],
  );
  if (parts.length === 0) return null;
  return (
    <span className={cn("block text-xs font-normal text-muted-foreground", className)} title={t("note")}>
      {t("approx", { values: parts.join(" · ") })}
    </span>
  );
}
