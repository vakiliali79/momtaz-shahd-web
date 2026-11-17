"use server";

import { z } from "zod";

import { firstIssue, type AdminResult } from "@/lib/admin/validation";
import { wholesaleStatuses } from "@/lib/admin/wholesale-statuses";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

const updateSchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(wholesaleStatuses),
  adminNote: z.string().trim().max(2000, "tooLong"),
});

/** Moves a wholesale enquiry through the sales workflow and keeps the team's notes. */
export async function updateWholesaleRequest(input: unknown): Promise<AdminResult> {
  if (!(await getAdminUser())) return { ok: false, error: "forbidden" };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const { id, status, adminNote } = parsed.data;
  const updated = await db.wholesaleRequest.updateMany({ where: { id }, data: { status, adminNote: adminNote || null } });
  return updated.count === 1 ? { ok: true } : { ok: false, error: "notFound" };
}
