import "server-only";

import { routing, type AppLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { allMessageKeys, fileMessages } from "@/lib/admin/translation-files";

export type TranslationRow = {
  key: string;
  values: Record<AppLocale, { file: string; override: string | null }>;
};

export const translationStateFilters = ["changed", "missing"] as const;

export async function listTranslations(params: {
  q: string;
  namespace?: string;
  state?: (typeof translationStateFilters)[number];
  page: number;
  pageSize: number;
}): Promise<{ rows: TranslationRow[]; total: number }> {
  const overrides = await db.translationOverride.findMany({ select: { locale: true, key: true, value: true } });
  const byKey = new Map<string, Partial<Record<AppLocale, string>>>();
  for (const row of overrides) {
    const locale = routing.locales.find((code) => code === row.locale);
    if (!locale) continue;
    byKey.set(row.key, { ...byKey.get(row.key), [locale]: row.value });
  }

  const q = params.q.toLowerCase();
  const matches = allMessageKeys.filter((key) => {
    if (params.namespace && !key.startsWith(`${params.namespace}.`)) return false;
    if (params.state === "changed" && !byKey.has(key)) return false;
    if (params.state === "missing" && routing.locales.every((locale) => fileMessages[locale][key])) return false;
    if (!q) return true;
    if (key.toLowerCase().includes(q)) return true;
    return routing.locales.some((locale) => {
      const value = byKey.get(key)?.[locale] ?? fileMessages[locale][key] ?? "";
      return value.toLowerCase().includes(q);
    });
  });

  const start = (params.page - 1) * params.pageSize;
  return {
    total: matches.length,
    rows: matches.slice(start, start + params.pageSize).map((key) => ({
      key,
      values: Object.fromEntries(
        routing.locales.map((locale) => [locale, { file: fileMessages[locale][key] ?? "", override: byKey.get(key)?.[locale] ?? null }]),
      ) as TranslationRow["values"],
    })),
  };
}
