import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

import { PLACEHOLDER_IMAGE } from "@/lib/site";

const PUBLIC_DIR = path.join(process.cwd(), "public");

function publicFileExists(src: string): boolean {
  if (!src.startsWith("/") || src.includes("..")) return false;
  return existsSync(path.join(PUBLIC_DIR, src));
}

/** Keeps remote URLs and local files that exist; drops missing local files. */
function isUsable(src: unknown): src is string {
  if (typeof src !== "string" || src === "") return false;
  if (/^https?:\/\//.test(src)) return true;
  return publicFileExists(src);
}

/**
 * Turns the `Product.images` JSON into a non-empty list of usable image
 * paths, falling back to the brand placeholder when no photo exists yet.
 */
export function resolveImages(images: unknown): string[] {
  const usable = Array.isArray(images) ? images.filter(isUsable) : [];
  return usable.length > 0 ? usable : [PLACEHOLDER_IMAGE];
}

export function resolveImage(image: unknown): string {
  return isUsable(image) ? image : PLACEHOLDER_IMAGE;
}
