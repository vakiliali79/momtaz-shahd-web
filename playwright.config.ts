import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3200);

/**
 * End-to-end tests (`pnpm test:e2e`). Playwright builds and starts the app on
 * its own port with a fresh seeded database (scripts/e2e/start-server.sh), so
 * your development database is never touched.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // The flows share one database (stock, coupons): run them in order.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "off",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "bash scripts/e2e/start-server.sh",
    url: `http://localhost:${port}/fa`,
    timeout: 10 * 60_000,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});
