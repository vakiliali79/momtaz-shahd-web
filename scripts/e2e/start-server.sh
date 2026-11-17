#!/usr/bin/env bash
# Production server for the Playwright tests (started by playwright.config.ts):
# a fresh, seeded SQLite database and the mock payment gateway.
set -euo pipefail
cd "$(dirname "$0")/../.."
export DATABASE_URL="file:./prisma/e2e.db"
export PAYMENT_GATEWAY="mock"
export ALLOW_MOCK_PAYMENTS="true"
export SMS_PROVIDER="console"
export NEXT_PUBLIC_SITE_URL="http://localhost:${E2E_PORT:-3200}"
export APP_URL="$NEXT_PUBLIC_SITE_URL"
rm -f prisma/e2e.db prisma/e2e.db-journal prisma/e2e.db-wal prisma/e2e.db-shm
pnpm exec prisma migrate deploy >/dev/null
pnpm exec prisma db seed >/dev/null
pnpm exec next build >/dev/null
exec pnpm exec next start -p "${E2E_PORT:-3200}"
