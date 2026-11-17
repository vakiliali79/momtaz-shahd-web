import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

/**
 * Unit and integration tests (`pnpm test`). Integration tests run against a
 * throwaway SQLite database created from the real migrations (tests/global-setup.ts).
 * End-to-end browser tests live in e2e/ and run with Playwright (`pnpm test:e2e`).
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${src}/` },
      // `server-only` throws outside React Server Components; tests run server code directly.
      { find: "server-only", replacement: fileURLToPath(new URL("./tests/stubs/empty.ts", import.meta.url)) },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    // Integration tests share one SQLite file: run files one at a time.
    fileParallelism: false,
    env: { DATABASE_URL: "file:./prisma/test.db", NODE_ENV: "test" },
  },
});
