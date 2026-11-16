"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { dealerSchema } from "@/lib/admin/dealer-schema";
import { firstIssue, type AdminResult } from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

const idSchema = z.string().min(1).max(64);

export async function saveDealer(id: unknown, input: unknown): Promise<AdminResult<{ id: string }>> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = dealerSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const targetId = id === null ? null : idSchema.safeParse(id).data;
  if (id !== null && !targetId) return { ok: false, error: "notFound" };

  const { location, images, openingHours, phone, whatsapp, instagram, ...rest } = parsed.data;
  const data = {
    ...rest,
    country: "IR",
    openingHours: Object.values(openingHours).some(Boolean) ? openingHours : undefined,
    phone: phone || null,
    whatsapp: whatsapp || null,
    instagram: instagram.replace(/^@/, "") || null,
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    image: images[0] ?? null,
  };
  try {
    const saved = targetId
      ? await db.dealer.update({ where: { id: targetId }, data, select: { id: true } })
      : await db.dealer.create({ data, select: { id: true } });
    updateTag("dealers");
    return { ok: true, data: { id: saved.id } };
  } catch (error) {
    console.error("[admin] saveDealer failed:", error);
    return { ok: false, error: "server" };
  }
}

const flagSchema = z.object({ id: idSchema, field: z.enum(["isActive", "isVerified"]), value: z.boolean() });

/** Quick toggles from the dealer list. */
export async function setDealerFlag(id: unknown, field: unknown, value: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = flagSchema.safeParse({ id, field, value });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const updated = await db.dealer.updateMany({ where: { id: parsed.data.id }, data: { [parsed.data.field]: parsed.data.value } });
  if (updated.count !== 1) return { ok: false, error: "notFound" };
  updateTag("dealers");
  return { ok: true };
}

export async function deleteDealer(id: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "notFound" };
  const deleted = await db.dealer.deleteMany({ where: { id: parsed.data } });
  if (deleted.count !== 1) return { ok: false, error: "notFound" };
  updateTag("dealers");
  return { ok: true };
}
