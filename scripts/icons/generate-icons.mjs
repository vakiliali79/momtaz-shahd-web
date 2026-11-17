/**
 * Generates the favicon, Apple touch icon and PWA icons from the brand mark
 * (the same drawing as <LogoMark> in src/components/layout/logo.tsx).
 * Run after changing the logo: node scripts/icons/generate-icons.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const RED = "#c8102e";
const CREAM = "#f5e6d3";
const LEAF = "#3e8e41";

/** The badge on a transparent square, `scale` of the canvas. */
const mark = (scale = 1, background = "none") => {
  const pad = (48 / scale - 48) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${48 + 2 * pad} ${48 + 2 * pad}">
  ${background === "none" ? "" : `<rect x="${-pad}" y="${-pad}" width="${48 + 2 * pad}" height="${48 + 2 * pad}" fill="${background}"/>`}
  <circle cx="24" cy="24" r="22" fill="${RED}"/>
  <circle cx="24" cy="24" r="17.5" fill="none" stroke="${CREAM}" stroke-width="1.25" stroke-dasharray="1.5 3" stroke-linecap="round"/>
  <path d="M24 35c-6.5-2.8-9.5-8-8.2-15.5C22 19.8 27.8 16.5 31.5 12c3.7 8.5 1.8 18.5-7.5 23z" fill="${LEAF}" stroke="${CREAM}" stroke-width="1.25" stroke-linejoin="round"/>
  <path d="M24 34c1-6 3.2-11 6.3-16" fill="none" stroke="${CREAM}" stroke-width="1.25" stroke-linecap="round"/>
</svg>`;
};

mkdirSync("public/icons", { recursive: true });
const png = (svg, size, file) => sharp(Buffer.from(svg), { density: 600 }).resize(size, size).png({ compressionLevel: 9 }).toFile(file);

await Promise.all([
  png(mark(), 192, "public/icons/icon-192.png"),
  png(mark(), 512, "public/icons/icon-512.png"),
  // Maskable: the badge inside the 80% safe zone on a cream background.
  png(mark(0.72, CREAM), 512, "public/icons/maskable-512.png"),
  png(mark(0.86, CREAM), 180, "src/app/apple-icon.png"),
  png(mark(), 48, "public/icons/icon-48.png"),
]);
// Scalable favicon for modern browsers (favicon.ico stays as the fallback).
writeFileSync("src/app/icon.svg", mark());
console.log("icons written");
