"use server";

import { after } from "next/server";

import { db } from "@/lib/db";
import { notifyNewWholesaleRequest } from "@/lib/notifications";
import { toWholesaleErrorKey, wholesaleRequestSchema, type WholesaleErrorKey } from "@/lib/validation/wholesale";

export type WholesaleRequestResult = { ok: true } | { ok: false; error: WholesaleErrorKey; field?: string };

/** At most this many requests per phone number per day (spam guard). */
const DAILY_LIMIT = 3;

/** Saves a wholesale request or dealer application and notifies the visitor and the team. */
export async function submitWholesaleRequest(input: unknown): Promise<WholesaleRequestResult> {
  const parsed = wholesaleRequestSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // A filled honeypot means a bot: pretend it worked, store nothing.
    if (issue?.path[0] === "website") return { ok: true };
    return {
      ok: false,
      error: toWholesaleErrorKey(issue?.message),
      field: typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
    };
  }
  const { website: _website, email, estimatedQty, message, ...data } = parsed.data;

  try {
    const recent = await db.wholesaleRequest.count({
      where: { phone: data.phone, createdAt: { gte: new Date(Date.now() - 86_400_000) } },
    });
    if (recent >= DAILY_LIMIT) return { ok: false, error: "tooMany" };

    const request = await db.wholesaleRequest.create({
      data: { ...data, email: email || null, estimatedQty: estimatedQty || null, message: message || null },
      select: { id: true },
    });
    after(() => notifyNewWholesaleRequest(request.id));
    return { ok: true };
  } catch (error) {
    console.error("[wholesale] Failed to save request:", error);
    return { ok: false, error: "server" };
  }
}
