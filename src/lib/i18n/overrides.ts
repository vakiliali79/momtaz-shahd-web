import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { AppLocale } from "@/i18n/routing";
import { db } from "@/lib/db";

/**
 * Interface texts edited in Admin → Translations. Rows override the value at
 * the same dot path in messages/{locale}.json; deleting a row restores it.
 */
export async function getTranslationOverrides(locale: AppLocale): Promise<Record<string, string>> {
  "use cache";
  cacheLife("max");
  cacheTag("translations");

  try {
    const rows = await db.translationOverride.findMany({ where: { locale }, select: { key: true, value: true } });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  } catch (error) {
    // The shop must still render from the message files if the table is unreachable.
    console.error("[i18n] Could not load translation overrides:", error);
    return {};
  }
}

type MessageTree = { [key: string]: string | MessageTree };

/** Returns a copy of `messages` with overrides applied to keys that exist as strings. */
export function applyOverrides<T extends MessageTree>(messages: T, overrides: Record<string, string>): T {
  if (Object.keys(overrides).length === 0) return messages;
  const copy: MessageTree = structuredClone(messages);
  for (const [path, value] of Object.entries(overrides)) {
    const parts = path.split(".");
    let node: MessageTree | string | undefined = copy;
    for (const part of parts.slice(0, -1)) node = typeof node === "object" ? node[part] : undefined;
    const last = parts.at(-1);
    if (typeof node === "object" && last !== undefined && typeof node[last] === "string") node[last] = value;
  }
  return copy as T;
}
