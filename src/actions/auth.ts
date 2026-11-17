"use server";

import bcrypt from "bcryptjs";
import { AuthError, CredentialsSignin } from "next-auth";

import { signIn, signOut } from "@/auth";
import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import {
  loginSchema,
  registerSchema,
  toAuthErrorKey,
  type AuthErrorKey,
} from "@/lib/validation/auth";

export type AuthResult = { ok: true } | { ok: false; error: AuthErrorKey; field?: string };

function firstIssue(issues: readonly { message: string; path: PropertyKey[] }[]): AuthResult {
  const issue = issues[0];
  return {
    ok: false,
    error: toAuthErrorKey(issue?.message),
    field: typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
  };
}

async function signInWithPassword(phone: string, password: string): Promise<AuthResult> {
  try {
    await signIn("credentials", { phone, password, redirect: false });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error instanceof CredentialsSignin && error.code === "blocked") {
        return { ok: false, error: "blocked" };
      }
      if (error instanceof CredentialsSignin && error.code === "rateLimited") {
        return { ok: false, error: "tooManyAttempts" };
      }
      return {
        ok: false,
        error: error.type === "CredentialsSignin" ? "invalidCredentials" : "server",
      };
    }
    throw error;
  }
}

export async function login(input: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return signInWithPassword(parsed.data.phone, parsed.data.password);
}

export async function register(input: unknown, locale: unknown): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const { name, phone, password } = parsed.data;
  if (!allowRequest(`register:ip:${await clientIp()}`, 10, 60 * 60_000)) {
    return { ok: false, error: "tooManyAttempts" };
  }

  const existing = await db.user.findUnique({ where: { phone }, select: { id: true } });
  if (existing) return { ok: false, error: "phoneTaken", field: "phone" };

  try {
    await db.user.create({
      data: {
        name,
        phone,
        passwordHash: await bcrypt.hash(password, 12),
        preferredLocale:
          typeof locale === "string" && routing.locales.some((l) => l === locale)
            ? locale
            : routing.defaultLocale,
      },
    });
  } catch (error) {
    console.error("[auth] Registration failed:", error);
    return { ok: false, error: "server" };
  }

  return signInWithPassword(phone, password);
}

export async function logout(): Promise<void> {
  await signOut({ redirect: false });
}
