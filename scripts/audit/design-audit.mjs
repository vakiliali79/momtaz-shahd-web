/**
 * Design & accessibility audit of the running site (start it first:
 * `pnpm build && pnpm start`). Checks every page in fa/en/ar at several
 * widths, in light and dark mode:
 *   - horizontal overflow (and which element causes it)
 *   - tap targets: a 44×44px area around each control must reach it
 *     (inline text links excluded)
 *   - axe-core WCAG 2.1 AA rules (names, labels, colour contrast, ARIA…)
 *   - Latin digits in Persian/Arabic text (outside dir="ltr" content)
 *   - document lang/dir
 *
 * Usage: node scripts/audit/design-audit.mjs [baseUrl] [outFile]
 * Env: AUDIT_ADMIN_PHONE/AUDIT_ADMIN_PASSWORD and AUDIT_USER_PHONE/AUDIT_USER_PASSWORD
 * enable the admin and account pages. AUDIT_ONLY=regex limits the pages.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require(require.resolve("playwright", { paths: [process.env.NODE_PATH ?? ""] }));
}
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "audit-report.json";
const ONLY = process.env.AUDIT_ONLY ? new RegExp(process.env.AUDIT_ONLY) : null;
const WIDTHS = [320, 375, 768, 1024, 1440, 2560];
const LOCALES = ["fa", "en", "ar"];

const publicPages = [
  "/", "/products", "/products/walnut-koloocheh-450g", "/category/koloocheh", "/cart", "/about", "/contact", "/wholesale",
  "/dealers", "/dealers/seed-dealer-tehran", "/dealers/apply", "/track", "/login", "/register", "/this-page-does-not-exist",
];
const accountPages = ["/account", "/account/orders", "/account/orders/MS-20261116-0004", "/account/addresses", "/account/profile", "/account/wishlist", "/account/reviews", "/checkout"];
const adminPages = [
  "/admin", "/admin/orders", "/admin/orders/MS-20261116-0004", "/admin/products", "/admin/products/new", "/admin/categories", "/admin/customers",
  "/admin/wholesale", "/admin/dealers", "/admin/dealers/new", "/admin/coupons", "/admin/coupons/new", "/admin/reviews", "/admin/settings", "/admin/translations",
];

/** Runs in the page: layout checks that axe does not cover. */
function layoutChecks(locale) {
  const width = window.innerWidth;
  const describe = (element) => {
    const id = element.id ? `#${element.id}` : "";
    const cls = typeof element.className === "string" ? "." + element.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
    const text = (element.getAttribute("aria-label") || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${element.tagName.toLowerCase()}${id}${cls === "." ? "" : cls} "${text}"`;
  };
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0 && !element.closest("[aria-hidden=true], .sr-only, [inert]");
  };
  // Horizontal overflow: elements sticking out of the viewport, unless inside a scroller.
  const overflow = [];
  if (document.documentElement.scrollWidth > width + 1) {
    for (const element of document.querySelectorAll("body *")) {
      const rect = element.getBoundingClientRect();
      if ((rect.right > width + 1 || rect.left < -1) && visible(element)) {
        let parent = element.parentElement;
        let clipped = false;
        while (parent && parent !== document.body) {
          const style = getComputedStyle(parent);
          if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { clipped = true; break; }
          parent = parent.parentElement;
        }
        if (!clipped) overflow.push(describe(element));
      }
      if (overflow.length >= 5) break;
    }
  }
  // Tap targets: a 44×44 square centred on the control must route taps to it
  // (so invisible hit areas and whole-card links count, crowded neighbours fail).
  const small = [];
  const hitsTarget = (element, x, y) => {
    if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) return true;
    const hit = document.elementFromPoint(x, y);
    if (!hit) return true;
    if (hit === element || element.contains(hit)) return true;
    const label = hit.closest("label");
    return Boolean(label && (label.control === element || label.contains(element)));
  };
  for (const element of document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=checkbox], [role=switch], [role=combobox], [role=radio]")) {
    if (!visible(element) || element.closest(".leaflet-control-attribution")) continue;
    let rect = element.getBoundingClientRect();
    if (rect.width >= 44 && rect.height >= 44) continue;
    // Inline links inside running text are exempt (WCAG 2.5.8 "inline").
    if (element.tagName === "A") {
      const block = element.closest("p, li, dd, td, span");
      const blockText = (block?.textContent ?? "").trim();
      if (block && blockText.length > (element.textContent ?? "").trim().length + 3) continue;
    }
    element.scrollIntoView({ block: "center", inline: "nearest" });
    rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const points = [[cx, cy], [cx - 21, cy - 21], [cx + 21, cy - 21], [cx - 21, cy + 21], [cx + 21, cy + 21]];
    const missed = points.filter(([x, y]) => !hitsTarget(element, x, y)).length;
    if (missed > 0) small.push(`${describe(element)} ${Math.round(rect.width)}×${Math.round(rect.height)}`);
  }
  window.scrollTo(0, 0);
  // Latin digits in Persian/Arabic text.
  const latin = [];
  if (locale !== "en") {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode() && latin.length < 8) {
      const node = walker.currentNode;
      // Codes (MS-20261116-0004, walnut-koloocheh-450g) and Latin-script user
      // content (an address typed in English) legitimately keep Latin digits.
      const raw = node.textContent ?? "";
      if (!/[0-9]/.test(raw)) continue;
      const letters = raw.match(/[A-Za-z\u0600-\u06FF]/g) ?? [];
      const latinLetters = raw.match(/[A-Za-z]/g) ?? [];
      if (letters.length > 0 && latinLetters.length / letters.length > 0.5) continue;
      const text = raw.replace(/[A-Za-z0-9][\w./-]*[A-Za-z][\w./-]*|[A-Za-z][\w./-]*\d[\w./-]*/g, "");
      if (!/[0-9]/.test(text)) continue;
      const parent = node.parentElement;
      if (!parent || !visible(parent)) continue;
      if (parent.closest('[dir="ltr"], code, script, style, input, textarea, .leaflet-container, [data-latin-digits]')) continue;
      latin.push(`${parent.tagName.toLowerCase()}: "${text.trim().slice(0, 50)}"`);
    }
  }
  return {
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    overflowPx: document.documentElement.scrollWidth - width,
    overflow,
    small: [...new Set(small)].slice(0, 15),
    latin,
    h1: document.querySelectorAll("h1").length,
  };
}

async function login(context, phone, password) {
  const page = await context.newPage();
  await page.goto(`${BASE}/fa/login`);
  await page.fill('input[name="phone"]', phone);
  await page.fill('input[name="password"]', password);
  await page.press('input[name="password"]', "Enter");
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 20000 });
  await page.close();
}

const browser = await playwright.chromium.launch();
const report = [];

async function audit(context, path, locale, width, theme, withAxe) {
  if (ONLY && !ONLY.test(path)) return;
  const page = await context.newPage();
  await page.setViewportSize({ width, height: width < 768 ? 800 : 900 });
  const consoleErrors = [];
  page.on("pageerror", (error) => consoleErrors.push(error.message.slice(0, 160)));
  try {
    const response = await page.goto(`${BASE}/${locale}${path}`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(600);
    const layout = await page.evaluate(layoutChecks, locale);
    let axe = [];
    if (withAxe) {
      await page.addScriptTag({ content: AXE });
      axe = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
          rules: { region: { enabled: false } },
        });
        return result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.slice(0, 4).map((node) => `${node.target.join(" ")} — ${(node.any[0]?.message ?? node.failureSummary ?? "").slice(0, 140)}`),
          count: violation.nodes.length,
        }));
      });
    }
    report.push({ path, locale, width, theme, status: response?.status(), ...layout, axe, consoleErrors });
  } catch (error) {
    report.push({ path, locale, width, theme, error: String(error).slice(0, 200) });
  } finally {
    await page.close();
  }
}

async function run(pages, auth) {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ colorScheme: theme, reducedMotion: "reduce" });
    await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
    if (auth) await login(context, auth.phone, auth.password);
    const jobs = [];
    for (const path of pages) {
      for (const locale of LOCALES) {
        // Layout at every width in light mode; axe at phone and desktop widths in both themes.
        const widths = theme === "light" ? WIDTHS : [375, 1440];
        for (const width of widths) jobs.push(() => audit(context, path, locale, width, theme, width === 375 || width === 1440));
      }
    }
    const workers = Array.from({ length: 4 }, async () => {
      while (jobs.length) await jobs.shift()();
    });
    await Promise.all(workers);
    await context.close();
  }
}

await run(publicPages, null);
if (process.env.AUDIT_USER_PHONE) await run(accountPages, { phone: process.env.AUDIT_USER_PHONE, password: process.env.AUDIT_USER_PASSWORD });
if (process.env.AUDIT_ADMIN_PHONE) await run(adminPages, { phone: process.env.AUDIT_ADMIN_PHONE, password: process.env.AUDIT_ADMIN_PASSWORD });
await browser.close();
writeFileSync(OUT, JSON.stringify(report, null, 2));

// Summary: issues grouped by page.
const byIssue = new Map();
const add = (key, where) => { const list = byIssue.get(key) ?? new Set(); list.add(where); byIssue.set(key, list); };
for (const entry of report) {
  const where = `${entry.locale}${entry.path} @${entry.width} ${entry.theme}`;
  if (entry.error) add(`ERROR ${entry.error}`, where);
  if (entry.status && entry.status >= 500) add(`HTTP ${entry.status}`, where);
  if (entry.overflowPx > 0) add(`overflow ${entry.overflow?.[0] ?? ""}`, where);
  for (const item of entry.small ?? []) add(`tap target ${item.replace(/ \d+×\d+$/, "")}`, `${where} ${item.match(/\d+×\d+$/)?.[0]}`);
  for (const item of entry.latin ?? []) add(`latin digits ${item}`, where);
  for (const violation of entry.axe ?? []) add(`axe ${violation.id}: ${violation.nodes[0] ?? ""}`, where);
  for (const message of entry.consoleErrors ?? []) add(`page error ${message}`, where);
  if (entry.dir && entry.dir !== (entry.locale === "en" ? "ltr" : "rtl")) add(`wrong dir ${entry.dir}`, where);
  if (entry.h1 === 0 && entry.status === 200) add("no <h1>", where);
}
const lines = [...byIssue].sort((a, b) => b[1].size - a[1].size).map(([issue, where]) => `[${where.size}] ${issue}\n      e.g. ${[...where].slice(0, 3).join(" | ")}`);
console.log(`${report.length} page checks, ${byIssue.size} distinct issues\n`);
console.log(lines.join("\n"));
