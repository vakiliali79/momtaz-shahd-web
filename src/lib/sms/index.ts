import "server-only";

import { db } from "@/lib/db";

/**
 * Text messages to customers. Chosen by SMS_PROVIDER:
 *
 *   console (default) — prints to the server log (development).
 *   kavenegar         — stub; see KavenegarSmsProvider.
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
 * Kavenegar — NOT IMPLEMENTED (stub). To implement:
 *   GET https://api.kavenegar.com/v1/{KAVENEGAR_API_KEY}/sms/send.json
 *       ?receptor={phone}&sender={KAVENEGAR_SENDER}&message={text}
 * (or verify/lookup.json with an approved template). The response's
 * `return.status` is 200 on success.
 */
class KavenegarSmsProvider implements SmsProvider {
  readonly id = "kavenegar";
  async send(): Promise<void> {
    throw new Error("Kavenegar SMS is not implemented yet (see src/lib/sms/index.ts).");
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
