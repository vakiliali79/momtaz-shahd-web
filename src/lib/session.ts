import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/client";
import type { AppLocale } from "@/i18n/routing";
import { db } from "@/lib/db";

/**
 * Data Access Layer for the signed-in user. Reading the session reads
 * cookies, so callers must render inside a <Suspense> boundary
 * (Cache Components).
 */

export type SessionUser = { id: string; name: string };

/** Lightweight: reads the session token only (no database query). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return { id, name: session.user?.name ?? "" };
}

export type CurrentUser = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: Role;
};

/** The signed-in user, fresh from the database (null if signed out or deleted). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  return db.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, phone: true, email: true, role: true },
  });
}

/** Like getCurrentUser, but redirects to the login page when signed out. */
export async function requireUser(locale: AppLocale, callbackPath: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}${callbackPath}`)}`);
  }
  return user;
}
