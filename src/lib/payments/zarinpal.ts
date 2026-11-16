import "server-only";

import type {
  PaymentGateway,
  PaymentRequestResult,
  PaymentVerifyResult,
} from "@/lib/payments/types";

/**
 * Zarinpal payment gateway, REST API v4.
 *
 *   request: POST {base}/v4/payment/request.json
 *   payer:   {base}/StartPay/{authority}
 *   return:  callback_url?Authority=…&Status=OK|NOK
 *   verify:  POST {base}/v4/payment/verify.json  → data.code 100 (paid) / 101 (already verified)
 *
 * NOTE: written from the documented v4 contract but not yet exercised against
 * the live sandbox (Zarinpal's servers refuse connections from outside Iran).
 * Before going live, run one sandbox payment end to end from an Iranian
 * server and compare responses with https://www.zarinpal.com/docs/.
 */

const BASE_URL = {
  production: "https://payment.zarinpal.com/pg",
  sandbox: "https://sandbox.zarinpal.com/pg",
} as const;

const TIMEOUT_MS = 15_000;

/** Codes meaning the payer definitely did not pay (safe to cancel the order). */
const DEFINITE_FAILURE_CODES = new Set([-51, -54]);

type ZarinpalResponse = {
  data?: {
    code?: number;
    message?: string;
    authority?: string;
    ref_id?: number | string;
    card_pan?: string;
    card_hash?: string;
    fee_type?: string;
    fee?: number;
  } | unknown[];
  errors?: { code?: number; message?: string } | unknown[];
};

function dataOf(body: ZarinpalResponse) {
  return body.data && !Array.isArray(body.data) ? body.data : undefined;
}

function errorCodeOf(body: ZarinpalResponse): number | undefined {
  return body.errors && !Array.isArray(body.errors) ? body.errors.code : undefined;
}

/** Zarinpal amounts are Rial unless a currency is given; we always send Rial. */
const toRial = (toman: number) => Math.round(toman) * 10;

export class ZarinpalGateway implements PaymentGateway {
  readonly id = "zarinpal" as const;
  private readonly base: string;

  constructor(
    private readonly merchantId: string | undefined,
    sandbox: boolean,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.base = sandbox ? BASE_URL.sandbox : BASE_URL.production;
  }

  get isConfigured(): boolean {
    // Merchant ids are 36-character UUIDs.
    return typeof this.merchantId === "string" && /^[0-9a-f-]{36}$/i.test(this.merchantId);
  }

  private async post(action: "request" | "verify", body: object): Promise<ZarinpalResponse> {
    const response = await this.fetchImpl(`${this.base}/v4/payment/${action}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    // Zarinpal reports business errors with 4xx and a JSON body; anything
    // that is not JSON (gateway down, HTML error page) is a transport error.
    const text = await response.text();
    try {
      return JSON.parse(text) as ZarinpalResponse;
    } catch {
      throw new Error(`Zarinpal ${action}: HTTP ${response.status}, non-JSON response`);
    }
  }

  async request(
    amount: number,
    orderId: string,
    callbackUrl: string,
    description: string,
  ): Promise<PaymentRequestResult> {
    if (!this.isConfigured) return { ok: false, error: "not_configured" };
    try {
      const body = await this.post("request", {
        merchant_id: this.merchantId,
        amount: toRial(amount),
        callback_url: callbackUrl,
        description: description.slice(0, 255),
        metadata: { order_id: orderId },
      });
      const data = dataOf(body);
      if (data?.code === 100 && data.authority) {
        return {
          ok: true,
          authority: data.authority,
          redirectUrl: `${this.base}/StartPay/${encodeURIComponent(data.authority)}`,
          raw: body,
        };
      }
      return { ok: false, error: `zarinpal_${errorCodeOf(body) ?? data?.code ?? "unknown"}`, raw: body };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "request_failed" };
    }
  }

  getAuthority(params: URLSearchParams): string | null {
    const authority = params.get("Authority");
    return authority && /^[A-Za-z0-9]{8,64}$/.test(authority) ? authority : null;
  }

  buildVerifyParams(authority: string): URLSearchParams {
    return new URLSearchParams({ Authority: authority, Status: "OK" });
  }

  async verify(params: URLSearchParams, amount: number): Promise<PaymentVerifyResult> {
    const authority = this.getAuthority(params);
    if (!authority) return { status: "failed", reason: "missing_authority", raw: null };
    if (!this.isConfigured) return { status: "error", reason: "not_configured" };

    // Always ask Zarinpal, even for Status=NOK: the query string comes from
    // the browser and proves nothing either way.
    let body: ZarinpalResponse;
    try {
      body = await this.post("verify", {
        merchant_id: this.merchantId,
        amount: toRial(amount),
        authority,
      });
    } catch (error) {
      return { status: "error", reason: error instanceof Error ? error.message : "verify_failed" };
    }

    const data = dataOf(body);
    if ((data?.code === 100 || data?.code === 101) && data.ref_id !== undefined) {
      return {
        status: "paid",
        refId: String(data.ref_id),
        cardPan: data.card_pan ?? null,
        alreadyVerified: data.code === 101,
        raw: body,
      };
    }

    const code = errorCodeOf(body) ?? data?.code;
    if (code !== undefined && DEFINITE_FAILURE_CODES.has(code)) {
      return { status: "failed", reason: `zarinpal_${code}`, raw: body };
    }
    // Amount mismatch, merchant problems, unknown codes: needs a human, not a cancellation.
    return { status: "error", reason: `zarinpal_${code ?? "unknown"}`, raw: body };
  }
}
