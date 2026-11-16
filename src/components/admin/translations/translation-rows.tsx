"use client";

import { useState, useTransition } from "react";
import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { resetTranslation, saveTranslation } from "@/actions/admin/translations";
import { Pill } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { localeMeta } from "@/i18n/locales";
import { routing, type AppLocale } from "@/i18n/routing";
import type { TranslationRow } from "@/lib/admin/translations";
import { cn } from "@/lib/utils";

function TranslationCell({ messageKey, locale, file, override }: { messageKey: string; locale: AppLocale; file: string; override: string | null }) {
  const t = useTranslations("admin.translations");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const current = override ?? file;
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();
  const dirty = value.trim() !== current;
  const id = `tr-${messageKey}-${locale}`;

  function run(action: () => Promise<{ ok: true } | { ok: false; error: Parameters<typeof tErrors>[0] }>, success: string) {
    startTransition(async () => {
      const result = await action().catch(() => ({ ok: false as const, error: "server" as const }));
      if (result.ok) {
        toast.success(success);
        router.refresh();
      } else toast.error(tErrors(result.error));
    });
  }

  return (
    <div className="space-y-1.5" lang={locale} dir={localeMeta[locale].dir}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{localeMeta[locale].nativeName}</label>
        {override !== null ? <Pill tone="gold">{t("changed")}</Pill> : !file ? <Pill tone="red">{t("missing")}</Pill> : null}
      </div>
      <Textarea
        id={id}
        rows={Math.min(6, Math.max(2, Math.ceil(current.length / 60)))}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={cn("rounded-xl text-sm", dirty && "border-brand-gold")}
      />
      {override !== null && file ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">{t("fileValue", { value: file })}</p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-1.5">
        {override !== null ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full"
            disabled={pending}
            onClick={() => {
              setValue(file);
              run(() => resetTranslation({ locale, key: messageKey }), t("resetDone"));
            }}
          >
            <RotateCcwIcon aria-hidden="true" />
            {t("reset")}
          </Button>
        ) : null}
        {dirty ? (
          <>
            <Button type="button" variant="ghost" size="sm" className="rounded-full" disabled={pending} onClick={() => setValue(current)}>
              {t("cancel")}
            </Button>
            <Button type="button" size="sm" className="rounded-full" disabled={pending} onClick={() => run(() => saveTranslation({ locale, key: messageKey, value }), t("saved"))}>
              {t("save")}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function TranslationRows({ rows }: { rows: TranslationRow[] }) {
  const t = useTranslations("admin.translations");
  if (rows.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">{t("empty")}</p>;
  }
  return (
    <ul className="space-y-4">
      {rows.map((row) => (
        <li key={row.key} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="mb-3 font-mono text-xs break-all text-muted-foreground" dir="ltr">
            <span className="block text-start">{row.key}</span>
          </p>
          <div className="grid gap-4 @container lg:grid-cols-3">
            {routing.locales.map((locale) => (
              // Remount when the saved value changes so the box shows it.
              <TranslationCell
                key={`${locale}:${row.values[locale].override ?? row.values[locale].file}`}
                messageKey={row.key}
                locale={locale}
                file={row.values[locale].file}
                override={row.values[locale].override}
              />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
