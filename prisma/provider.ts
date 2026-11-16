import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Prisma fixes the database provider inside the schema file, so one schema
 * cannot serve both SQLite (local dev) and PostgreSQL (production) as-is.
 * `prisma/schema.prisma` is the source of truth (SQLite); for PostgreSQL we
 * derive a copy with only the provider (and relative output path) swapped.
 * Each provider keeps its own migration history, because migration SQL is
 * database-specific.
 */

export const DEFAULT_DEV_DATABASE_URL = "file:./prisma/dev.db";

export type DatabaseProvider = "sqlite" | "postgresql";

export function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set in production.");
  }
  return DEFAULT_DEV_DATABASE_URL;
}

export function getDatabaseProvider(url: string): DatabaseProvider {
  if (/^postgres(ql)?:\/\//.test(url)) return "postgresql";
  if (url.startsWith("file:")) return "sqlite";
  throw new Error(
    'Unsupported DATABASE_URL: use "file:…" (SQLite) or "postgresql://…".',
  );
}

const SOURCE_SCHEMA = "prisma/schema.prisma";
const POSTGRES_DIR = "prisma/postgresql";

/** Returns the schema and migrations paths for the given provider. */
export function prepareSchema(provider: DatabaseProvider): {
  schema: string;
  migrations: string;
} {
  if (provider === "sqlite") {
    return { schema: SOURCE_SCHEMA, migrations: "prisma/migrations" };
  }

  const source = readFileSync(SOURCE_SCHEMA, "utf8");
  const derived =
    "// GENERATED from prisma/schema.prisma by prisma/provider.ts — do not edit.\n\n" +
    source
      .replace('provider = "sqlite"', 'provider = "postgresql"')
      .replace('"../src/generated/prisma"', '"../../src/generated/prisma"');

  if (!derived.includes('provider = "postgresql"')) {
    throw new Error("Could not switch the datasource provider to postgresql.");
  }

  const target = path.join(POSTGRES_DIR, "schema.prisma");
  mkdirSync(POSTGRES_DIR, { recursive: true });
  let current: string | null = null;
  try {
    current = readFileSync(target, "utf8");
  } catch {
    // First run: the derived schema does not exist yet.
  }
  if (current !== derived) writeFileSync(target, derived);

  return { schema: target, migrations: path.join(POSTGRES_DIR, "migrations") };
}
