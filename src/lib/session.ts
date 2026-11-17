import "server-only";

import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

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

/**
 * The signed-in user's id and name. Also confirms the account still exists
 * and is not blocked, so a blocked user's existing session stops working.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  // Auth.js creates random tokens before it reads the request, which Cache
  // Components would treat as prerendered randomness: mark the read dynamic.
  await connection();
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, isBlocked: true },
  });
  if (!user || user.isBlocked) return null;
  return { id: user.id, name: user.name ?? user.phone };
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

/**
 * For admin pages: redirects signed-out visitors to the login page and shows
 * a 404 to anyone who is not an ADMIN (so the admin area is not advertised).
 */
export async function requireAdmin(locale: AppLocale, callbackPath: string): Promise<CurrentUser> {
  const user = await requireUser(locale, callbackPath);
  if (user.role !== "ADMIN") notFound();
  return user;
}

/** For admin server actions and route handlers: the admin, or null. */
export async function getAdminUser(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

/** Like getCurrentUser, but redirects to the login page when signed out. */
export async function requireUser(locale: AppLocale, callbackPath: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}${callbackPath}`)}`);
  }
  return user;
}
