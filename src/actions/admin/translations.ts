"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { routing } from "@/i18n/routing";
import { checkTranslation } from "@/lib/admin/translation-check";
import { fileMessages } from "@/lib/admin/translation-files";
import type { AdminResult } from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

const target = z.object({ locale: z.enum(routing.locales), key: z.string().min(1).max(200) });

/** Saves an edited interface text for one language. Saving the file's own text removes the override. */
export async function saveTranslation(input: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = target.extend({ value: z.string().trim().min(1, "required").max(2000, "tooLong") }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message === "tooLong" ? "tooLong" : "required" };
  const { locale, key, value } = parsed.data;
  const original = fileMessages[locale][key];
  if (original === undefined) return { ok: false, error: "notFound" };
  const problem = checkTranslation(value, original, locale);
  if (problem) return { ok: false, error: problem };

  if (value === original) {
    await db.translationOverride.deleteMany({ where: { locale, key } });
  } else {
    await db.translationOverride.upsert({
      where: { locale_key: { locale, key } },
      update: { value },
      create: { locale, key, value },
    });
  }
  updateTag("translations");
  return { ok: true };
}

/** Goes back to the text in the message file. */
export async function resetTranslation(input: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = target.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await db.translationOverride.deleteMany({ where: parsed.data });
  updateTag("translations");
  return { ok: true };
}
