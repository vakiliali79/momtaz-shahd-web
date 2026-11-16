import "server-only";

import type {
  PaymentGateway,
  PaymentRequestResult,
  PaymentVerifyResult,
} from "@/lib/payments/types";

/**
 * IDPay gateway — NOT IMPLEMENTED (stub).
 *
 * To implement: POST https://api.idpay.ir/v1.1/payment with headers
 * `X-API-KEY` (and `X-SANDBOX: 1` for testing), body { order_id, amount
 * (Rial), callback, desc }; redirect to the returned `link`, keep `id` as the
 * authority. IDPay returns by POST (or GET) with `id`, `status`, `order_id`;
 * confirm with POST https://api.idpay.ir/v1.1/payment/verify { id, order_id }
 * (status 100 = paid, 101 = already verified). Check the current IDPay docs.
 *
 * Until then it reports itself as unconfigured, so online payment stays hidden.
 */
export class IDPayGateway implements PaymentGateway {
  readonly id = "idpay" as const;
  readonly isConfigured = false;

  async request(): Promise<PaymentRequestResult> {
    return { ok: false, error: "idpay_not_implemented" };
  }

  getAuthority(params: URLSearchParams): string | null {
    const id = params.get("id");
    return id && /^[A-Za-z0-9]{8,64}$/.test(id) ? id : null;
  }

  buildVerifyParams(authority: string): URLSearchParams {
    return new URLSearchParams({ id: authority });
  }

  async verify(): Promise<PaymentVerifyResult> {
    return { status: "error", reason: "idpay_not_implemented" };
  }
}
