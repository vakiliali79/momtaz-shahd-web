"use server";

import { z } from "zod";

import type { AdminResult } from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

const idSchema = z.string().min(1).max(64);
const roleSchema = z.enum(["CUSTOMER", "WHOLESALE"]);

/**
 * Loads a customer the admin may change: not themselves and not another
 * admin (admins are managed outside the panel, so nobody locks everyone out).
 */
async function editableTarget(
  id: unknown,
): Promise<{ ok: true; userId: string } | { ok: false; error: "forbidden" | "notFound" }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "forbidden" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "notFound" };
  const user = await db.user.findUnique({ where: { id: parsed.data }, select: { id: true, role: true } });
  if (!user) return { ok: false, error: "notFound" };
  if (user.id === admin.id || user.role === "ADMIN") return { ok: false, error: "forbidden" };
  return { ok: true, userId: user.id };
}

/** Promotes a customer to wholesale buyer, or back to a regular customer. */
export async function setCustomerRole(id: unknown, role: unknown): Promise<AdminResult> {
  const target = await editableTarget(id);
  if (!target.ok) return target;
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await db.user.update({ where: { id: target.userId }, data: { role: parsed.data } });
  return { ok: true };
}

/** Blocked customers cannot sign in, and their open sessions stop working. */
export async function setCustomerBlocked(id: unknown, blocked: unknown): Promise<AdminResult> {
  const target = await editableTarget(id);
  if (!target.ok) return target;
  const parsed = z.boolean().safeParse(blocked);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await db.user.update({ where: { id: target.userId }, data: { isBlocked: parsed.data } });
  return { ok: true };
}
