import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

import { PLACEHOLDER_IMAGE } from "@/lib/site";

const PUBLIC_DIR = path.join(process.cwd(), "public");

function publicFileExists(src: string): boolean {
  if (!src.startsWith("/") || src.includes("..")) return false;
  return existsSync(path.join(PUBLIC_DIR, src));
}

/**
 * Generated photography is stored as WebP next to the path the data refers
 * to, so `/products/walnut-koloocheh-450g-1.jpg` is served from
 * `/products/walnut-koloocheh-450g-1.webp` without touching product data.
 */
function webpSibling(src: string): string | null {
  return /\.(jpe?g|png)$/i.test(src) ? src.replace(/\.(jpe?g|png)$/i, ".webp") : null;
}

/** Keeps remote URLs and local files that exist (or their WebP sibling). */
function toUsable(src: unknown): string | null {
  if (typeof src !== "string" || src === "") return null;
  if (/^https?:\/\//.test(src)) return src;
  const webp = webpSibling(src);
  if (webp && publicFileExists(webp)) return webp;
  return publicFileExists(src) ? src : null;
}

/**
 * Turns the `Product.images` JSON into a non-empty list of usable image
 * paths, falling back to the brand placeholder when no photo exists yet.
 */
export function resolveImages(images: unknown): string[] {
  const usable = Array.isArray(images)
    ? images.map(toUsable).filter((src): src is string => src !== null)
    : [];
  return usable.length > 0 ? usable : [PLACEHOLDER_IMAGE];
}

export function resolveImage(image: unknown): string {
  return toUsable(image) ?? PLACEHOLDER_IMAGE;
}
