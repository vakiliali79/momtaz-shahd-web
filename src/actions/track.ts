"use server";

import { noteKey } from "@/lib/orders/history-notes";
import { db } from "@/lib/db";
import type { LocalizedText } from "@/lib/localized";
import { getOrderForAdmin, type OrderView } from "@/lib/orders/queries";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { toTrackErrorKey, trackSchema, type TrackErrorKey } from "@/lib/validation/track";

/** What a visitor sees about an order after proving they know its phone number. */
export type TrackedOrder = Pick<
  OrderView,
  "orderNumber" | "status" | "createdAt" | "total" | "shippingMethod" | "paymentMethod" | "trackingCode" | "history"
> & { items: { id: string; productName: string; quantity: number }[]; city: LocalizedText | null };

export type TrackResult = { ok: true; order: TrackedOrder } | { ok: false; error: TrackErrorKey; field?: "orderNumber" | "phone" };

/**
 * Looks up an order by number and the customer's mobile number. The answer
 * is the same "not found" whether the number or the phone is wrong, and
 * attempts are limited per visitor and per order number.
 */
export async function trackOrder(input: unknown): Promise<TrackResult> {
  const parsed = trackSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0] === "phone" ? "phone" : "orderNumber";
    return { ok: false, error: toTrackErrorKey(issue?.message), field };
  }
  const { orderNumber, phone } = parsed.data;
  const ip = await clientIp();
  if (!allowRequest(`track:ip:${ip}`, 20, 10 * 60_000) || !allowRequest(`track:order:${orderNumber}`, 8, 60 * 60_000)) {
    return { ok: false, error: "tooMany" };
  }

  try {
    const owner = await db.order.findFirst({ where: { orderNumber, user: { phone } }, select: { id: true } });
    const order = owner ? await getOrderForAdmin(orderNumber) : null;
    if (!order) return { ok: false, error: "notFound" };
    return {
      ok: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        total: order.total,
        shippingMethod: order.shippingMethod,
        paymentMethod: order.paymentMethod,
        trackingCode: order.trackingCode,
        city: order.address?.city.name ?? null,
        items: order.items.map(({ id, productName, quantity }) => ({ id, productName, quantity })),
        // Only customer-facing notes: staff notes never leave the server.
        history: order.history.map((entry) => ({ ...entry, note: noteKey(entry.note) ? entry.note : null })),
      },
    };
  } catch (error) {
    console.error("[track] Lookup failed:", error);
    return { ok: false, error: "server" };
  }
}
