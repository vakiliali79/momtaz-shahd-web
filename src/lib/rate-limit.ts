import "server-only";

import { headers } from "next/headers";

/**
 * Fixed-window request limiter kept in this server's memory. Good enough to
 * slow down guessing on a single instance; behind several instances use a
 * shared store (e.g. Redis) instead.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export async function clientIp(): Promise<string> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
}

/** True when `key` may make another request (and counts it). */
export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (windows.size > 10_000) {
    for (const [entry, value] of windows) if (value.resetAt <= now) windows.delete(entry);
  }
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}
