/**
 * Contract tests for the Zarinpal client against a stubbed fetch.
 * Response bodies follow the documented v4 shapes; re-check them against a
 * real sandbox run before going live.
 *
 * Run with `pnpm test` (Vitest).
 */
import assert from "node:assert/strict";
import { test } from "vitest";

import { ZarinpalGateway } from "./zarinpal";

const MERCHANT = "1344b5d4-0048-11e8-94db-005056a205be";
type Call = { url: string; body: Record<string, unknown> };

function stub(responses: Array<{ status: number; body: unknown } | Error>) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init?.body)) });
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    if (next instanceof Error) throw next;
    return new Response(typeof next.body === "string" ? next.body : JSON.stringify(next.body), { status: next.status });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

test("Zarinpal gateway", async () => {
  // not configured
  assert.equal(new ZarinpalGateway(undefined, true).isConfigured, false);
  assert.equal(new ZarinpalGateway("bad", true).isConfigured, false);

  // request success: Rial amount, sandbox URL, StartPay redirect
  {
    const { calls, fetchImpl } = stub([{ status: 200, body: { data: { code: 100, message: "Success", authority: "A00000000000000000000000000217885159", fee_type: "Merchant", fee: 100 }, errors: [] } }]);
    const gw = new ZarinpalGateway(MERCHANT, true, fetchImpl);
    const r = await gw.request(383000, "MS-20261116-0001", "https://shop.test/api/payment/callback?locale=fa", "desc");
    assert.equal(calls[0]?.url, "https://sandbox.zarinpal.com/pg/v4/payment/request.json");
    assert.deepEqual(calls[0]?.body, { merchant_id: MERCHANT, amount: 3830000, callback_url: "https://shop.test/api/payment/callback?locale=fa", description: "desc", metadata: { order_id: "MS-20261116-0001" } });
    assert.ok(r.ok && r.redirectUrl === "https://sandbox.zarinpal.com/pg/StartPay/A00000000000000000000000000217885159");
  }
  // production base URL
  {
    const { calls, fetchImpl } = stub([{ status: 200, body: { data: { code: 100, authority: "A0000000000000000000000000001" }, errors: [] } }]);
    const r = await new ZarinpalGateway(MERCHANT, false, fetchImpl).request(1000, "x", "https://s/cb", "d");
    assert.equal(calls[0]?.url, "https://payment.zarinpal.com/pg/v4/payment/request.json");
    assert.ok(r.ok && r.redirectUrl.startsWith("https://payment.zarinpal.com/pg/StartPay/"));
  }
  // request error payload and transport errors
  {
    const { fetchImpl } = stub([{ status: 400, body: { data: [], errors: { code: -9, message: "The input params invalid, validation error.", validations: [] } } }, new Error("timeout"), { status: 502, body: "<html>bad gateway</html>" }]);
    const gw = new ZarinpalGateway(MERCHANT, true, fetchImpl);
    const a = await gw.request(1000, "x", "https://s/cb", "d"); assert.ok(!a.ok && a.error === "zarinpal_-9");
    const b = await gw.request(1000, "x", "https://s/cb", "d"); assert.ok(!b.ok && b.error === "timeout");
    const c = await gw.request(1000, "x", "https://s/cb", "d"); assert.ok(!c.ok && /non-JSON/.test(c.error));
  }
  // verify outcomes
  {
    const { calls, fetchImpl } = stub([
      { status: 200, body: { data: { code: 100, message: "Verified", card_hash: "h", card_pan: "502229******5995", ref_id: 201, fee_type: "Merchant", fee: 0 }, errors: [] } },
      { status: 200, body: { data: { code: 101, message: "Verified", card_pan: "502229******5995", ref_id: 201 }, errors: [] } },
      { status: 400, body: { data: [], errors: { code: -51, message: "Session is not valid, session is not active paid try." } } },
      { status: 400, body: { data: [], errors: { code: -50, message: "Session is not valid, amounts values is not the same." } } },
      new Error("socket hang up"),
    ]);
    const gw = new ZarinpalGateway(MERCHANT, true, fetchImpl);
    const params = new URLSearchParams({ Authority: "A00000000000000000000000000217885159", Status: "OK" });
    const v1 = await gw.verify(params, 383000);
    assert.deepEqual(calls[0]?.body, { merchant_id: MERCHANT, amount: 3830000, authority: "A00000000000000000000000000217885159" });
    assert.equal(calls[0]?.url, "https://sandbox.zarinpal.com/pg/v4/payment/verify.json");
    assert.ok(v1.status === "paid" && v1.refId === "201" && !v1.alreadyVerified && v1.cardPan === "502229******5995");
    const v2 = await gw.verify(params, 383000); assert.ok(v2.status === "paid" && v2.alreadyVerified);
    const v3 = await gw.verify(new URLSearchParams({ Authority: "A00000000000000000000000000217885159", Status: "NOK" }), 383000);
    assert.ok(v3.status === "failed" && v3.reason === "zarinpal_-51");
    const v4 = await gw.verify(params, 383000); assert.ok(v4.status === "error", "amount mismatch must not cancel");
    const v5 = await gw.verify(params, 383000); assert.ok(v5.status === "error", "network error must not cancel");
    // tampered authority never reaches the network
    const v6 = await gw.verify(new URLSearchParams({ Authority: "../../x", Status: "OK" }), 1); assert.equal(v6.status, "failed");
    assert.equal(calls.length, 5);
  }
});
