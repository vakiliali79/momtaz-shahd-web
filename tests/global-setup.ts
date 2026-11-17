import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";

/** Creates a fresh SQLite test database from the migrations before the test run. */
export default function setup() {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) rmSync(`prisma/test.db${suffix}`, { force: true });
  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
    stdio: "pipe",
  });
}
