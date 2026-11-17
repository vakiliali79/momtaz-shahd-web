import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getAdminUser } from "@/lib/session";
import { getPublicStorage } from "@/lib/storage/public-files";
import { sniffReceiptType } from "@/lib/validation/receipt";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const folderSchema = z.enum(["products", "categories", "dealers"]);

/**
 * Admin image upload (multipart: `file`, `folder`). Returns `{ url }`.
 * Accepts JPEG, PNG and WebP up to 5 MB, checked from the file's bytes.
 */
export async function POST(request: NextRequest) {
  // Same-origin only (cookies are SameSite=Lax too, but be explicit).
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.nextUrl.host) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await getAdminUser())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const folder = folderSchema.safeParse(form?.get("folder"));
  if (!(file instanceof File) || !folder.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "fileTooLarge" }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffReceiptType(bytes);
  if (!type || type.ext === "pdf") return NextResponse.json({ error: "fileType" }, { status: 400 });

  const key = `${folder.data}/${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${type.ext}`;
  try {
    const url = await getPublicStorage().save(key, bytes, type.mime);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[uploads] Save failed:", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
