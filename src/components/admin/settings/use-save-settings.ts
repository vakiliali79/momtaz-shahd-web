"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saveSettings } from "@/actions/admin/settings";
import type { SettingKey } from "@/lib/settings-schemas";

/** Saves settings and reports the result; returns the failing field path, if any. */
export function useSaveSettings() {
  const t = useTranslations("admin.settings");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  return async (values: Partial<Record<SettingKey, unknown>>): Promise<string | null> => {
    const result = await saveSettings(values).catch(() => ({ ok: false as const, error: "server" as const, field: undefined }));
    if (result.ok) {
      toast.success(t("saved"));
      router.refresh();
      return null;
    }
    toast.error(tErrors(result.error));
    return result.field ?? "";
  };
}
