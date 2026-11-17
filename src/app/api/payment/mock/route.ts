import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getPaymentGateway } from "@/lib/payments";
import { getAppOrigin } from "@/lib/site";

const schema = z.object({
  authority: z.string().regex(/^MOCK[0-9A-F]{24}$/),
  decision: z.enum(["pay", "cancel", "timeout"]),
  callback: z.string().url(),
});

/**
 * The simulated bank page's Pay/Cancel buttons (mock gateway only): records
 * the decision for MockGateway.verify, then sends the customer to the real
 * callback with Authority + Status, exactly like a real gateway.
 */
export async function POST(request: NextRequest) {
  const home = new URL("/", request.nextUrl.origin);
  if (getPaymentGateway()?.id !== "mock") return NextResponse.redirect(home, 303);

  const form = await request.formData();
  const parsed = schema.safeParse({
    authority: form.get("authority"),
    decision: form.get("decision"),
    callback: form.get("callback"),
  });
  if (!parsed.success) return NextResponse.redirect(home, 303);
  const { authority, decision, callback } = parsed.data;

  // Only ever return to our own callback endpoint on this site (no open redirect).
  const target = new URL(callback);
  const ownOrigins = new Set([request.nextUrl.origin, new URL(getAppOrigin()).origin]);
  if (!ownOrigins.has(target.origin) || target.pathname !== "/api/payment/callback") {
    return NextResponse.redirect(home, 303);
  }

  await db.payment.updateMany({
    where: { authority, gateway: "mock", status: "PENDING" },
    data: { gatewayData: { mockDecision: decision } },
  });
  target.searchParams.set("Authority", authority);
  target.searchParams.set("Status", decision === "pay" ? "OK" : "NOK");
  return NextResponse.redirect(target, 303);
}
