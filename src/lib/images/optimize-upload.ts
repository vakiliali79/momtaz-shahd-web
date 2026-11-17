import "server-only";

import sharp from "sharp";

/** Longest side kept for uploaded photos; next/image makes the smaller sizes. */
const MAX_DIMENSION = 2000;

/**
 * Normalises an uploaded photo: applies the camera orientation, strips
 * metadata (GPS etc.), caps the size and re-encodes it as WebP. next/image
 * then serves AVIF or WebP at the size each screen needs.
 */
export async function optimizeUpload(input: Uint8Array): Promise<{ data: Uint8Array; ext: "webp"; mime: "image/webp"; width: number; height: number }> {
  const { data, info } = await sharp(input, { failOn: "error", limitInputPixels: 50_000_000 })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), ext: "webp", mime: "image/webp", width: info.width, height: info.height };
}
