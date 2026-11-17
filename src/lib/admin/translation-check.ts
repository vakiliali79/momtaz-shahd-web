import "server-only";

import { IntlMessageFormat } from "intl-messageformat";

type AstNode = { type: number; value?: string; options?: Record<string, { value: AstNode[] }>; children?: AstNode[] };

/** Names of the {placeholders} (and plural/select arguments) in an ICU message. */
function argumentNames(nodes: AstNode[], out = new Set<string>()): Set<string> {
  for (const node of nodes) {
    // Type 0 is literal text and 7 is "#" in plurals; every other node names an argument (except tags).
    if (node.type !== 0 && node.type !== 7 && node.type !== 8 && typeof node.value === "string") out.add(node.value);
    if (node.children) argumentNames(node.children, out);
    if (node.options) for (const option of Object.values(node.options)) argumentNames(option.value, out);
  }
  return out;
}

function parse(message: string, locale: string): Set<string> | null {
  try {
    return argumentNames(new IntlMessageFormat(message, locale, undefined, { ignoreTag: true }).getAst() as AstNode[]);
  } catch {
    return null;
  }
}

/**
 * Checks an edited text against the file's original: it must be valid ICU
 * syntax and use exactly the same placeholders (the code fills them in).
 */
export function checkTranslation(value: string, original: string, locale: string): "invalidMessage" | "placeholdersChanged" | null {
  const next = parse(value, locale);
  if (!next) return "invalidMessage";
  const before = parse(original, locale) ?? new Set<string>();
  if (next.size !== before.size || [...before].some((name) => !next.has(name))) return "placeholdersChanged";
  return null;
}
