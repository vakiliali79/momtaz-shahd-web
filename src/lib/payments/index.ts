import "server-only";

import { IDPayGateway } from "@/lib/payments/idpay";
import { MockGateway } from "@/lib/payments/mock";
import { gatewayIds, type GatewayId, type PaymentGateway } from "@/lib/payments/types";
import { ZarinpalGateway } from "@/lib/payments/zarinpal";

/**
 * Gateway selection from the environment:
 *
 *   PAYMENT_GATEWAY=mock|zarinpal|idpay   (empty: online payment hidden)
 *   ZARINPAL_MERCHANT_ID=<uuid>           ZARINPAL_SANDBOX=true|false
 *   ALLOW_MOCK_PAYMENTS=true              (needed to use "mock" in production)
 *
 * The mock gateway lets anyone mark an order as paid, so it is refused in
 * production unless explicitly allowed for a staging server.
 */

function createGateway(id: GatewayId): PaymentGateway | null {
  switch (id) {
    case "mock": {
      const allowed =
        process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENTS === "true";
      if (!allowed) {
        console.error("[payments] PAYMENT_GATEWAY=mock is refused in production.");
        return null;
      }
      return new MockGateway();
    }
    case "zarinpal":
      return new ZarinpalGateway(
        process.env.ZARINPAL_MERCHANT_ID,
        process.env.ZARINPAL_SANDBOX === "true",
      );
    case "idpay":
      return new IDPayGateway();
  }
}

function isGatewayId(value: string | undefined): value is GatewayId {
  return gatewayIds.some((id) => id === value);
}

/** The gateway new payments use, or null when online payment is off. */
export function getPaymentGateway(): PaymentGateway | null {
  const id = process.env.PAYMENT_GATEWAY;
  if (!id) return null;
  if (!isGatewayId(id)) {
    console.error(`[payments] Unknown PAYMENT_GATEWAY "${id}".`);
    return null;
  }
  const gateway = createGateway(id);
  if (gateway && !gateway.isConfigured) {
    console.error(`[payments] Gateway "${id}" is selected but not configured.`);
    return null;
  }
  return gateway;
}

/**
 * The gateway a stored payment was made with, to verify it even if the
 * active gateway has changed since.
 */
export function getGatewayById(id: string): PaymentGateway | null {
  return isGatewayId(id) ? createGateway(id) : null;
}

export function isOnlinePaymentEnabled(): boolean {
  return getPaymentGateway() !== null;
}

/** Gateways to try when matching an incoming callback to a payment. */
export function allGateways(): PaymentGateway[] {
  return gatewayIds.flatMap((id) => {
    const gateway = createGateway(id);
    return gateway ? [gateway] : [];
  });
}
