import "server-only";

import { randomBytes } from "node:crypto";

import { db } from "@/lib/db";
import type {
  PaymentGateway,
  PaymentRequestResult,
  PaymentVerifyResult,
} from "@/lib/payments/types";

/**
 * Simulated gateway for development. `request` sends the customer to a fake
 * bank page (/payment/mock) with Pay and Cancel buttons; the button stores
 * the decision on the payment row and returns to the real callback, and
 * `verify` reads that decision back — so the callback code path is exactly
 * the one a real gateway uses. Never enable in production (see index.ts).
 */
export class MockGateway implements PaymentGateway {
  readonly id = "mock" as const;
  readonly isConfigured = true;

  async request(
    _amount: number,
    _orderId: string,
    callbackUrl: string,
  ): Promise<PaymentRequestResult> {
    const authority = `MOCK${randomBytes(12).toString("hex").toUpperCase()}`;
    const locale = new URL(callbackUrl).searchParams.get("locale") ?? "fa";
    const query = new URLSearchParams({ authority, callback: callbackUrl });
    return { ok: true, authority, redirectUrl: `/${locale}/payment/mock?${query.toString()}` };
  }

  getAuthority(params: URLSearchParams): string | null {
    const authority = params.get("Authority");
    return authority && /^MOCK[0-9A-F]{24}$/.test(authority) ? authority : null;
  }

  buildVerifyParams(authority: string): URLSearchParams {
    return new URLSearchParams({ Authority: authority, Status: "OK" });
  }

  async verify(params: URLSearchParams): Promise<PaymentVerifyResult> {
    const authority = this.getAuthority(params);
    if (!authority) return { status: "failed", reason: "missing_authority", raw: null };

    const payment = await db.payment.findUnique({ where: { authority } });
    const decision =
      payment?.gatewayData && typeof payment.gatewayData === "object" && "mockDecision" in payment.gatewayData
        ? payment.gatewayData.mockDecision
        : undefined;

    if (!payment) return { status: "failed", reason: "mock_unknown_authority", raw: null };
    if (decision === "pay") {
      return {
        status: "paid",
        // Derived from the authority so repeated checks return the same reference.
        refId: `MOCK-${authority.slice(-8)}`,
        cardPan: "6037-99**-****-1234",
        alreadyVerified: payment.status === "PAID",
        raw: { mockDecision: decision },
      };
    }
    if (decision === "cancel") return { status: "failed", reason: "mock_cancelled", raw: { mockDecision: decision } };
    // Simulates a bank that does not answer: the outcome stays unknown.
    if (decision === "timeout") return { status: "error", reason: "mock_timeout" };
    // The customer came back without pressing either button.
    return { status: "failed", reason: "mock_no_decision", raw: null };
  }
}
