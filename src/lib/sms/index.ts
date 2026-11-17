import "server-only";

import { db } from "@/lib/db";

/**
 * Text messages to customers. Chosen by SMS_PROVIDER:
 *
 *   console (default) — prints to the server log (development).
 *   kavenegar         — Kavenegar's send API (KAVENEGAR_API_KEY, KAVENEGAR_SENDER).
 *
 * Every attempt is recorded in the SmsLog table. Sending never throws: an
 * order update must not fail because a text message could not be sent.
 */
interface SmsProvider {
  readonly id: string;
  send(phone: string, message: string): Promise<void>;
}

class ConsoleSmsProvider implements SmsProvider {
  readonly id = "console";
  async send(phone: string, message: string) {
    console.info(`[sms] to ${phone}: ${message}`);
  }
}

/**
 * Kavenegar (https://kavenegar.com) simple send API. Needs KAVENEGAR_API_KEY
 * and KAVENEGAR_SENDER (your dedicated line number).
 */
class KavenegarSmsProvider implements SmsProvider {
  readonly id = "kavenegar";
  async send(phone: string, message: string): Promise<void> {
    const key = process.env.KAVENEGAR_API_KEY;
    const sender = process.env.KAVENEGAR_SENDER;
    if (!key || !sender) throw new Error("KAVENEGAR_API_KEY and KAVENEGAR_SENDER must be set.");
    // The API key is part of the URL: never let a network error (which may
    // include the URL) reach the logs.
    const response = await fetch(`https://api.kavenegar.com/v1/${encodeURIComponent(key)}/sms/send.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ receptor: phone, sender, message }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {
      throw new Error("Kavenegar could not be reached.");
    });
    const body: unknown = await response.json().catch(() => null);
    const status =
      body && typeof body === "object" && "return" in body && body.return && typeof body.return === "object" && "status" in body.return
        ? body.return.status
        : response.status;
    if (status !== 200) throw new Error(`Kavenegar refused the message (status ${String(status)}).`);
  }
}

function getProvider(): SmsProvider {
  return process.env.SMS_PROVIDER === "kavenegar" ? new KavenegarSmsProvider() : new ConsoleSmsProvider();
}

export async function sendSms(phone: string, message: string): Promise<boolean> {
  const provider = getProvider();
  let error: string | null = null;
  try {
    await provider.send(phone, message);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
    console.error("[sms] Send failed:", error);
  }
  await db.smsLog
    .create({
      data: { phone, message, provider: provider.id, status: error ? "failed" : "sent", error },
    })
    .catch((cause: unknown) => console.error("[sms] Could not log message:", cause));
  return error === null;
}
