/**
 * Keyboard walkthrough of the running site: skip link, header order,
 * drawers (focus moves in, is trapped, Escape closes, focus returns),
 * form error focus, the dealer list, and visible focus indicators.
 * Usage: node scripts/audit/keyboard-audit.mjs [baseUrl]
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require(require.resolve("playwright", { paths: [process.env.NODE_PATH ?? ""] }));
}
const BASE = process.argv[2] ?? "http://localhost:3000";
const browser = await playwright.chromium.launch();
const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? "✓" : "✗"} ${message}`);
  if (!ok) failures.push(message);
};

/** Name, tag and whether a visible focus indicator (outline, ring/box-shadow) is drawn. */
const focused = (page) =>
  page.evaluate(() => {
    const element = document.activeElement;
    if (!element || element === document.body) return { name: "(body)", visible: false, inDialog: false };
    const style = getComputedStyle(element);
    const outline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    const ring = style.boxShadow !== "none";
    const after = getComputedStyle(element, "::after");
    const afterOutline = after.outlineStyle !== "none" && parseFloat(after.outlineWidth) > 0;
    return {
      name: (element.getAttribute("aria-label") || element.textContent || element.getAttribute("placeholder") || element.tagName).trim().replace(/\s+/g, " ").slice(0, 40),
      tag: element.tagName.toLowerCase(),
      visible: outline || ring || afterOutline,
      inDialog: Boolean(element.closest("[role=dialog]")),
    };
  });

for (const [locale, width] of [["fa", 1280], ["en", 1280], ["ar", 375], ["fa", 375]]) {
  const context = await browser.newContext({ viewport: { width, height: 850 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`${BASE}/${locale}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  console.log(`\n— ${locale} @${width}`);

  await page.keyboard.press("Tab");
  let current = await focused(page);
  check(/skip|پرش|تخطّ|انتقال|محتوا|المحتوى/i.test(current.name), `first Tab reaches the skip link ("${current.name}")`);
  await page.keyboard.press("Enter");
  current = await page.evaluate(() => document.activeElement?.id ?? "");
  check(current === "main-content", "skip link moves focus to <main>");

  // Header: every stop has a name and a visible indicator.
  await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined));
  await page.goto(`${BASE}/${locale}`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const stops = [];
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
    stops.push(await focused(page));
  }
  const unnamed = stops.filter((stop) => !stop.name || /^(BUTTON|A)$/.test(stop.name));
  const noRing = stops.filter((stop) => !stop.visible);
  check(unnamed.length === 0, `header tab stops all have names (${stops.map((stop) => stop.name).join(" → ")})`);
  check(noRing.length === 0, `header tab stops all show a focus indicator${noRing.length ? `: missing on ${noRing.map((stop) => stop.name).join(", ")}` : ""}`);

  // Drawers: the cart, and the mobile menu on phones.
  const drawers = [{ name: "cart", trigger: page.locator("header button[aria-haspopup=dialog]").last() }];
  if (width < 768) drawers.unshift({ name: "menu", trigger: page.locator("header button[aria-haspopup=dialog]").first() });
  for (const drawer of drawers) {
    await drawer.trigger.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    current = await focused(page);
    check(current.inDialog, `${drawer.name} drawer: focus moves inside ("${current.name}")`);
    let escaped = false;
    for (let index = 0; index < 25; index += 1) {
      await page.keyboard.press("Tab");
      if (!(await focused(page)).inDialog) escaped = true;
    }
    check(!escaped, `${drawer.name} drawer: focus stays trapped`);
    const side = await page.evaluate(() => {
      const box = document.querySelector("[role=dialog]")?.getBoundingClientRect();
      return box ? (box.left < 2 ? "left" : "right") : "none";
    });
    const expected = drawer.name === "cart" ? (locale === "en" ? "right" : "left") : locale === "en" ? "left" : "right";
    check(side === expected, `${drawer.name} drawer opens from the ${expected} (inline-${drawer.name === "cart" ? "end" : "start"}) side`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    const back = await page.evaluate(() => Boolean(document.activeElement?.getAttribute("aria-haspopup")));
    check(back, `${drawer.name} drawer: Escape closes it and focus returns to its button`);
  }
  await context.close();
}

// Forms: submitting empty moves focus to the first invalid field.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  for (const [path, submit] of [["/fa/contact", "ارسال پیام"], ["/en/wholesale", "Send request"], ["/ar/track", "تتبّع الطلب"], ["/en/register", "Create account"]]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "load" });
    await page.waitForTimeout(400);
    const button = page.getByRole("button", { name: submit });
    if ((await button.count()) === 0) {
      check(false, `${path}: submit button "${submit}" not found`);
      continue;
    }
    await button.first().focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);
    const state = await page.evaluate(() => ({
      invalid: document.activeElement?.getAttribute("aria-invalid"),
      described: Boolean(document.getElementById(document.activeElement?.getAttribute("aria-describedby")?.split(" ")[0] ?? "")),
      name: (document.activeElement?.id ?? "") + " " + (document.activeElement?.getAttribute("name") ?? ""),
    }));
    check(state.invalid === "true" && state.described, `${path}: focus moves to the first invalid field, linked to its message (${state.name.trim()})`);
  }

  // Dealer list: search, type filters, near me and "show on map" are all reachable; Enter selects a dealer.
  await page.goto(`${BASE}/en/dealers`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  await page.getByLabel("Search by city or name…").focus();
  const seen = [];
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press("Tab");
    seen.push((await focused(page)).name);
  }
  check(seen.some((name) => name === "Distributor") && seen.some((name) => /Near me/.test(name)) && seen.some((name) => /Show on map/.test(name)), `dealer list reachable by Tab (${seen.join(" → ")})`);
  await page.getByRole("button", { name: "Show on map" }).first().focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  check((await page.locator(".leaflet-popup").count()) === 1, "Enter on “Show on map” opens the dealer popup");
  await context.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} keyboard problem(s)` : "\nAll keyboard checks passed");
