import "server-only";

import nodemailer from "nodemailer";

type Mail = { subject: string; text: string; replyTo?: string };

/**
 * Sends an email to the site admin (ADMIN_EMAIL) through SMTP.
 * Returns false, without throwing, when SMTP is not configured or the send
 * fails, so callers can treat email as best-effort.
 */
export async function sendAdminEmail({ subject, text, replyTo }: Mail): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, ADMIN_EMAIL } =
    process.env;

  if (!SMTP_HOST || !ADMIN_EMAIL) {
    console.warn("[email] SMTP_HOST or ADMIN_EMAIL is not set; email not sent:", subject);
    return false;
  }

  try {
    const port = Number(SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD ?? "" } : undefined,
    });
    await transport.sendMail({
      from: SMTP_FROM || ADMIN_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      text,
      replyTo,
    });
    return true;
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return false;
  }
}
