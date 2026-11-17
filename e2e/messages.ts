import ar from "../messages/ar.json";
import en from "../messages/en.json";
import fa from "../messages/fa.json";

export type Locale = "fa" | "en" | "ar";
const catalogs = { fa, en, ar } as const;

/** The text a message key shows in a locale, with simple {placeholders} filled in. */
export function m(locale: Locale, key: string, values: Record<string, string> = {}): string {
  let node: unknown = catalogs[locale];
  for (const part of key.split(".")) {
    node = node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined;
  }
  if (typeof node !== "string") throw new Error(`No message ${locale}:${key}`);
  return node.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}

/** The part of a message before its first {placeholder}, e.g. "Pay " from "Pay {amount}". */
export function prefix(locale: Locale, key: string): string {
  return m(locale, key).split("{")[0] ?? "";
}

export const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
