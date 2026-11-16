/**
 * Swappable online payment gateways. Each gateway turns an amount into a
 * redirect to the bank page, and later verifies the payment the customer
 * returns with. Amounts passed in and out are always Toman; a gateway that
 * works in Rial converts internally.
 */

export const gatewayIds = ["mock", "zarinpal", "idpay"] as const;
export type GatewayId = (typeof gatewayIds)[number];

export type PaymentRequestResult =
  | {
      ok: true;
      /** The gateway's token for this attempt, used to find it on return. */
      authority: string;
      /** Where to send the customer (absolute for real gateways). */
      redirectUrl: string;
      raw?: unknown;
    }
  | { ok: false; error: string; raw?: unknown };

export type PaymentVerifyResult =
  /** The money was taken. `alreadyVerified` is true when this was a repeat check. */
  | { status: "paid"; refId: string; cardPan: string | null; alreadyVerified: boolean; raw: unknown }
  /** The gateway says the payment definitely did not happen. */
  | { status: "failed"; reason: string; raw: unknown }
  /**
   * The outcome is unknown (network error, unexpected answer). The order must
   * stay pending: money may have been taken, so never cancel on this.
   */
  | { status: "error"; reason: string; raw?: unknown };

export interface PaymentGateway {
  readonly id: GatewayId;
  /** False when required settings (e.g. a merchant id) are missing. */
  readonly isConfigured: boolean;
  /**
   * Starts a payment.
   * @param amount Toman
   * @param orderId Our order reference, shown in the gateway's panel.
   * @param callbackUrl Absolute URL the gateway sends the customer back to.
   * @param description Shown to the payer on the bank page.
   */
  request(
    amount: number,
    orderId: string,
    callbackUrl: string,
    description: string,
  ): Promise<PaymentRequestResult>;
  /** Reads this gateway's token from the callback parameters (null if absent). */
  getAuthority(params: URLSearchParams): string | null;
  /** Callback-like parameters for re-checking a stored attempt. */
  buildVerifyParams(authority: string): URLSearchParams;
  /**
   * Confirms the payment with the gateway. Must be called before trusting a
   * callback: its parameters come from the customer's browser.
   * @param amount Toman — the amount stored when the payment was requested.
   */
  verify(params: URLSearchParams, amount: number): Promise<PaymentVerifyResult>;
}
