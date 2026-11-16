import { NextResponse, type NextRequest } from "next/server";

import { handlePaymentCallback } from "@/lib/payments/service";

/**
 * Gateways send the customer back here after payment: Zarinpal by GET with
 * ?Authority=…&Status=…, some gateways by POST form. The parameters are only
 * used to find the attempt; the outcome always comes from verifying with the
 * gateway server-to-server. Safe to call any number of times.
 */
async function handle(request: NextRequest): Promise<NextResponse> {
  const params = new URLSearchParams(request.nextUrl.searchParams);
  if (request.method === "POST") {
    const type = request.headers.get("content-type") ?? "";
    if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
      const form = await request.formData();
      for (const [key, value] of form) if (typeof value === "string") params.set(key, value);
    }
  }
  const target = await handlePaymentCallback(params);
  // 303 so a POST callback becomes a GET of the result page.
  return NextResponse.redirect(new URL(target, request.nextUrl.origin), 303);
}

export const GET = handle;
export const POST = handle;
