import "server-only";

// Email/SMS senders for guest outreach (REQUIREMENTS.md section 4.4/6).
// No Resend/Twilio credentials exist yet, so both fall back to a dev logger
// rather than shipping unverified third-party integration code. Once real
// credentials are available:
//   - Email: swap the body below for the Resend SDK (`resend.emails.send`).
//   - SMS: swap the body below for the Twilio SDK (`client.messages.create`).
// Keep the function signatures the same so nothing else has to change.

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[dev email — no RESEND_API_KEY set] to=${to}\nsubject: ${subject}\n${body}\n`);
    return { ok: true };
  }
  // TODO: wire up Resend here once RESEND_API_KEY is configured.
  console.log(`\n[dev email — RESEND_API_KEY set but not yet wired up] to=${to}\nsubject: ${subject}\n${body}\n`);
  return { ok: true };
}

export async function sendSms(to: string, body: string): Promise<SendResult> {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`\n[dev sms — no TWILIO_ACCOUNT_SID set] to=${to}\n${body}\n`);
    return { ok: true };
  }
  // TODO: wire up Twilio here once TWILIO_ACCOUNT_SID/credentials are configured.
  console.log(`\n[dev sms — Twilio configured but not yet wired up] to=${to}\n${body}\n`);
  return { ok: true };
}
