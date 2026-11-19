#!/usr/bin/env node
// Converts generated source images into optimised WebP files under public/.
//   node scripts/images/import-generated.mjs <source-dir> [--dry-run]
// Source files are matched by shot id (e.g. walnut-koloocheh-450g-1.png).
// An optional crops.json in the source folder maps a shot id to a sharp crop
// position ("north", "south", "east", "west", "entropy" …); default "attention".
// Sources smaller than the target are cropped to the target aspect ratio
// but never upscaled.
// Nothing in the database is touched: the storefront serves `x.webp` for
// any `x.jpg` reference once the WebP file exists.
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

import { SHOTS } from "./shot-list.mjs";

const [sourceDir, flag] = process.argv.slice(2);
if (!sourceDir || !existsSync(sourceDir)) {
  console.error("Usage: node scripts/images/import-generated.mjs <source-dir> [--dry-run]");
  process.exit(1);
}
const dryRun = flag === "--dry-run";
const files = readdirSync(sourceDir);
const cropsFile = path.join(sourceDir, "crops.json");
/** @type {Record<string, string>} */
const crops = existsSync(cropsFile) ? JSON.parse(readFileSync(cropsFile, "utf8")) : {};
const publicDir = path.join(process.cwd(), "public");
const missing = [];
let written = 0;

for (const shot of SHOTS) {
  const source = files.find((file) => /\.(png|jpe?g|webp|avif)$/i.test(file) && path.parse(file).name === shot.id);
  if (!source) {
    missing.push(shot.id);
    continue;
  }
  const target = path.join(publicDir, shot.out);
  if (dryRun) {
    console.log(`would write ${shot.out} from ${source}`);
    continue;
  }
  mkdirSync(path.dirname(target), { recursive: true });
  const input = sharp(path.join(sourceDir, source)).rotate();
  const meta = await input.metadata();
  const sourceWidth = meta.autoOrient?.width ?? meta.width ?? shot.width;
  const sourceHeight = meta.autoOrient?.height ?? meta.height ?? shot.height;
  const scale = Math.min(1, sourceWidth / shot.width, sourceHeight / shot.height);
  const info = await input
    .resize(Math.round(shot.width * scale), Math.round(shot.height * scale), { fit: "cover", position: crops[shot.id] ?? "attention" })
    .webp({ quality: 80, effort: 6 })
    .toFile(target);
  written += 1;
  console.log(`${shot.out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}

console.log(`\n${written} written, ${missing.length} missing of ${SHOTS.length} shots.`);
if (missing.length > 0) console.log(`Missing: ${missing.join(", ")}`);
