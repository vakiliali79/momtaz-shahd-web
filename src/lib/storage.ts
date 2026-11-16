import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Private file storage on the local disk (UPLOAD_DIR, default ./storage),
 * outside `public/` so files are only served through permission-checked
 * routes. On hosts with an ephemeral disk, replace with object storage
 * (e.g. S3) behind the same functions.
 */
const ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "storage"));

function resolveKey(key: string): string {
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new Error("Invalid storage key");
  return full;
}

export async function saveFile(key: string, data: Uint8Array): Promise<string> {
  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return key;
}

export async function readStoredFile(key: string): Promise<Buffer | null> {
  try {
    return await readFile(resolveKey(key));
  } catch {
    return null;
  }
}

export async function deleteStoredFile(key: string): Promise<void> {
  await rm(resolveKey(key), { force: true });
}
