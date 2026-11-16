import "server-only";

/**
 * Online payment gateway selection (PAYMENT_GATEWAY env var).
 *
 * Only a simulated "mock" gateway exists so far. It lets the buyer choose
 * success or failure, so anyone could mark an order as paid: it is refused
 * in production unless ALLOW_MOCK_PAYMENTS="true" (for a staging server).
 * A real gateway (e.g. Zarinpal, IDPay) plugs in here.
 */
export type PaymentGateway = "mock";

export function getPaymentGateway(): PaymentGateway | null {
  if (process.env.PAYMENT_GATEWAY !== "mock") return null;
  const allowed =
    process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENTS === "true";
  if (!allowed) {
    console.error("[payments] PAYMENT_GATEWAY=mock is refused in production.");
    return null;
  }
  return "mock";
}

export function isOnlinePaymentEnabled(): boolean {
  return getPaymentGateway() !== null;
}
