"use server";

import { db } from "@/lib/db";
import { sendAdminEmail } from "@/lib/email";
import {
  contactSchema,
  toContactErrorKey,
  type ContactErrorKey,
} from "@/lib/validation/contact";

export type ContactResult =
  | { ok: true }
  | { ok: false; error: ContactErrorKey; field?: string };

export async function sendContactMessage(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // A filled honeypot means a bot: pretend it worked, store nothing.
    if (issue?.path[0] === "website") return { ok: true };
    return {
      ok: false,
      error: toContactErrorKey(issue?.message),
      field: typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
    };
  }

  const { name, phone, email, subject, message, locale } = parsed.data;

  try {
    await db.contactMessage.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        subject: subject || null,
        message,
        locale,
      },
    });
  } catch (error) {
    console.error("[contact] Failed to save message:", error);
    return { ok: false, error: "server" };
  }

  // The message is already saved; a failed email must not fail the request.
  await sendAdminEmail({
    subject: `[Momtaz Shahd] Contact form: ${subject || name}`,
    replyTo: email || undefined,
    text: [
      `Name: ${name}`,
      `Phone: ${phone || "-"}`,
      `Email: ${email || "-"}`,
      `Language: ${locale}`,
      `Subject: ${subject || "-"}`,
      "",
      message,
    ].join("\n"),
  });

  return { ok: true };
}
