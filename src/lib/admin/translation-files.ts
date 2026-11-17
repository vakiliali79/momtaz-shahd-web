import "server-only";

import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import fa from "../../../messages/fa.json";
import type { AppLocale } from "@/i18n/routing";

/** Message file values flattened to dot paths, e.g. "home.hero.title". */
function flatten(tree: unknown, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  if (typeof tree === "string") out[prefix] = tree;
  else if (tree && typeof tree === "object") {
    for (const [key, value] of Object.entries(tree)) flatten(value, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}

export const fileMessages: Record<AppLocale, Record<string, string>> = {
  fa: flatten(fa),
  en: flatten(en),
  ar: flatten(ar),
};

/** Every key, in the order of the Persian (default) file, then any extras. */
export const allMessageKeys: string[] = [
  ...new Set([...Object.keys(fileMessages.fa), ...Object.keys(fileMessages.en), ...Object.keys(fileMessages.ar)]),
];

export const messageNamespaces: string[] = [...new Set(allMessageKeys.map((key) => key.split(".")[0] ?? key))];
