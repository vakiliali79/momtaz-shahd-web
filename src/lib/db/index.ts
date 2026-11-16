import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";

import { createPrismaClient } from "./client";

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
