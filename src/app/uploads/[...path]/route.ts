import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { UPLOADS_DIR } from "@/lib/storage/public-files";
import { sniffReceiptType } from "@/lib/validation/receipt";

/**
 * Serves images uploaded after the build (Next.js serves only files that
 * were in public/ at build time). Keys are random and never reused, so the
 * response can be cached forever.
 */
export async function GET(_request: Request, { params }: RouteContext<"/uploads/[...path]">) {
  const { path: parts } = await params;
  const full = path.resolve(UPLOADS_DIR, ...parts);
  if (!full.startsWith(UPLOADS_DIR + path.sep)) return new NextResponse(null, { status: 404 });

  const data = await readFile(full).catch(() => null);
  const type = data ? sniffReceiptType(data) : null;
  if (!data || !type || type.ext === "pdf") return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": type.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
