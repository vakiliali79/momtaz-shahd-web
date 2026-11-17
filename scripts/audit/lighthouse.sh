#!/usr/bin/env bash
# Mobile Lighthouse (default throttling) on the key storefront pages, median of
# several runs. Start the site first, built with NEXT_PUBLIC_SITE_URL set to the
# URL you test (so canonical URLs match), e.g.:
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000 pnpm build && pnpm start
#   scripts/audit/lighthouse.sh http://localhost:3000 3
# Set CHROME_PATH if Chrome isn't found automatically.
set -euo pipefail
BASE="${1:-http://localhost:3000}"
RUNS="${2:-3}"
OUT="$(mktemp -d)"
PAGES=("/fa" "/en" "/ar" "/fa/products" "/en/products" "/ar/products" "/fa/products/walnut-koloocheh-450g" "/en/products/walnut-koloocheh-450g" "/ar/products/walnut-koloocheh-450g")
for path in "${PAGES[@]}"; do
  for i in $(seq 1 "$RUNS"); do
    npx --yes lighthouse@13.6.0 "$BASE$path" --quiet --output=json --output-path="$OUT/run-$i.json" \
      --only-categories=performance,accessibility,best-practices,seo \
      --chrome-flags="--headless=new --no-sandbox" >/dev/null 2>&1
  done
  node -e '
    const fs = require("fs"); const [dir, runs, path] = process.argv.slice(1);
    const reports = Array.from({ length: +runs }, (_, i) => JSON.parse(fs.readFileSync(`${dir}/run-${i + 1}.json`, "utf8")));
    const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const score = (id) => median(reports.map((r) => Math.round(r.categories[id].score * 100)));
    const lcp = median(reports.map((r) => r.audits["largest-contentful-paint"].numericValue)) / 1000;
    const tbt = median(reports.map((r) => r.audits["total-blocking-time"].numericValue));
    console.log(`${path.padEnd(40)} perf ${score("performance")}  a11y ${score("accessibility")}  bp ${score("best-practices")}  seo ${score("seo")}  LCP ${lcp.toFixed(1)}s  TBT ${Math.round(tbt)}ms`);
  ' "$OUT" "$RUNS" "$path"
done
