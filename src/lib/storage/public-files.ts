import "server-only";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Storage for public files such as product photos. Chosen by STORAGE_DRIVER:
 *
 *   local (default) — files in public/uploads, served at /uploads/… by
 *                     src/app/uploads/[...path]/route.ts (Next.js only serves
 *                     files that were in public/ at build time).
 *   s3              — S3-compatible object storage (Liara, ArvanCloud, …):
 *                     stub, see S3PublicStorage below.
 */
export interface PublicFileStorage {
  /** Saves the file and returns the URL to store in the database. */
  save(key: string, data: Uint8Array, contentType: string): Promise<string>;
  /** Deletes a file previously returned by `save` (ignores unknown URLs). */
  remove(url: string): Promise<void>;
}

export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

class LocalPublicStorage implements PublicFileStorage {
  private resolve(key: string): string {
    const full = path.resolve(UPLOADS_DIR, key);
    if (!full.startsWith(UPLOADS_DIR + path.sep)) throw new Error("Invalid upload key");
    return full;
  }

  async save(key: string, data: Uint8Array): Promise<string> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    return `/uploads/${key}`;
  }

  async remove(url: string): Promise<void> {
    if (!url.startsWith("/uploads/")) return;
    await rm(this.resolve(url.slice("/uploads/".length)), { force: true });
  }
}

/**
 * S3-compatible storage — NOT IMPLEMENTED (stub).
 *
 * To implement with @aws-sdk/client-s3 (works with Liara and ArvanCloud):
 *   S3_ENDPOINT    e.g. https://storage.iran.liara.space or https://s3.ir-thr-at1.arvanstorage.ir
 *   S3_REGION      e.g. "default"
 *   S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY
 *   S3_PUBLIC_URL  public base URL of the bucket (or a CDN in front of it)
 * save: PutObjectCommand({ Bucket, Key, Body, ContentType, ACL: "public-read" })
 *       → `${S3_PUBLIC_URL}/${key}`; remove: DeleteObjectCommand.
 * Remote image hosts must also be allowed in next.config `images.remotePatterns`.
 */
class S3PublicStorage implements PublicFileStorage {
  async save(): Promise<string> {
    throw new Error("S3 storage is not implemented yet (see src/lib/storage/public-files.ts).");
  }
  async remove(): Promise<void> {
    throw new Error("S3 storage is not implemented yet.");
  }
}

export function getPublicStorage(): PublicFileStorage {
  return process.env.STORAGE_DRIVER === "s3" ? new S3PublicStorage() : new LocalPublicStorage();
}
