"use server";

import bcrypt from "bcryptjs";

import { updateSession } from "@/auth";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import {
  passwordSchema,
  profileSchema,
  toProfileErrorKey,
  type ProfileErrorKey,
} from "@/lib/validation/profile";

export type ProfileResult = { ok: true } | { ok: false; error: ProfileErrorKey; field?: string };

function firstIssue(issues: readonly { message: string; path: PropertyKey[] }[]): ProfileResult {
  const issue = issues[0];
  return {
    ok: false,
    error: toProfileErrorKey(issue?.message),
    field: typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
  };
}

export async function updateProfile(input: unknown): Promise<ProfileResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const { name, email, preferredLocale } = parsed.data;

  if (email) {
    const taken = await db.user.findFirst({
      where: { email, NOT: { id: user.id } },
      select: { id: true },
    });
    if (taken) return { ok: false, error: "emailTaken", field: "email" };
  }

  try {
    await db.user.update({
      where: { id: user.id },
      data: { name, email: email || null, preferredLocale },
    });
    // Keep the name shown in the header in step.
    await updateSession({ user: { name } });
    return { ok: true };
  } catch (error) {
    console.error("[profile] Update failed:", error);
    return { ok: false, error: "server" };
  }
}

export async function changePassword(input: unknown): Promise<ProfileResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const { currentPassword, newPassword } = parsed.data;

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) return { ok: false, error: "unauthorized" };
  // Accounts created without a password (future OTP sign-in) can set one directly.
  if (record.passwordHash && !(await bcrypt.compare(currentPassword, record.passwordHash))) {
    return { ok: false, error: "wrongPassword", field: "currentPassword" };
  }

  try {
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });
    return { ok: true };
  } catch (error) {
    console.error("[profile] Password change failed:", error);
    return { ok: false, error: "server" };
  }
}
