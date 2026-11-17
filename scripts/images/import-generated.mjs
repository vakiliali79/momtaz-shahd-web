#!/usr/bin/env node
// Converts generated source images into optimised WebP files under public/.
//   node scripts/images/import-generated.mjs <source-dir> [--dry-run]
// Source files are matched by shot id (e.g. walnut-koloocheh-450g-1.png).
// Nothing in the database is touched: the storefront serves `x.webp` for
// any `x.jpg` reference once the WebP file exists.
import { existsSync, mkdirSync, readdirSync } from "node:fs";
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
  const info = await sharp(path.join(sourceDir, source))
    .rotate()
    .resize(shot.width, shot.height, { fit: "cover", position: "attention" })
    .webp({ quality: 80, effort: 6 })
    .toFile(target);
  written += 1;
  console.log(`${shot.out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}

console.log(`\n${written} written, ${missing.length} missing of ${SHOTS.length} shots.`);
if (missing.length > 0) console.log(`Missing: ${missing.join(", ")}`);
