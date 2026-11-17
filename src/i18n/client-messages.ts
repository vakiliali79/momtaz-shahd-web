import "server-only";

import type { Messages } from "next-intl";

/**
 * Namespaces only read on the server (server components, metadata, SMS and
 * notification texts). They are left out of the messages sent to the
 * browser on every page. `admin` is added back by the admin layout only.
 * If a client component starts using one of these, remove it from the list.
 */
const SERVER_ONLY = ["wholesalePage", "about", "dealerApply", "sms", "notifications", "metadata", "notFound", "offline", "home", "payment"] as const;

export function clientMessages(messages: Messages, { includeAdmin }: { includeAdmin: boolean }): Partial<Messages> {
  const omitted = new Set<string>(includeAdmin ? SERVER_ONLY : [...SERVER_ONLY, "admin"]);
  return Object.fromEntries(Object.entries(messages).filter(([namespace]) => !omitted.has(namespace)));
}
