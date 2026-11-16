import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

import { getDatabaseProvider, resolveDatabaseUrl } from "../../../prisma/provider";

/**
 * Creates a Prisma client for the database DATABASE_URL points at:
 * SQLite ("file:…") in local development, PostgreSQL in production.
 *
 * The generated client must match the provider, so run `prisma generate`
 * (done automatically by `pnpm install` and `pnpm build`) with the same
 * DATABASE_URL that the app runs with.
 */
export function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl();
  const adapter =
    getDatabaseProvider(url) === "postgresql"
      ? new PrismaPg({ connectionString: url })
      : new PrismaBetterSqlite3({ url });

  return new PrismaClient({ adapter });
}
