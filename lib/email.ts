import { Resend } from "resend";

/**
 * Sends the one-time subscription confirmation email. Separate from
 * sendCampaign — this always goes to exactly one address, immediately
 * after signup, and isn't logged as a "campaign."
 */
export async function sendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return { success: false, error: "Missing RESEND_API_KEY or RESEND_FROM_EMAIL." };
  }

  const resend = new Resend(apiKey);
  const html = `
<p>Hello,</p>
<p>You're subscribed to Aion macro regime notifications.</p>
<p>You'll receive an email whenever the macro regime changes — for example, when the model transitions from Recovery to Overheat.</p>
<p style="font-size:12px;color:#888;">If you didn't request this, you can ignore this email.</p>
`.trim();

  try {
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: "You're subscribed to Aion macro regime updates",
      html,
    });
    return { success: !error, error: error?.message };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Unknown error" };
  }
}

export type SendResult = { email: string; success: boolean; error?: string };

/**
 * Sends one email per recipient (not a single email with everyone in BCC —
 * this keeps per-recipient delivery status accurate for the admin dashboard).
 * Requires RESEND_API_KEY and a verified sender domain/address in
 * RESEND_FROM_EMAIL — see README.md for setup.
 */
export async function sendCampaign(
  recipients: string[],
  subject: string,
  html: string
): Promise<SendResult[]> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL environment variable. See README.md.");
  }

  const resend = new Resend(apiKey);

  const results: SendResult[] = [];
  for (const email of recipients) {
    try {
      const { error } = await resend.emails.send({ from, to: email, subject, html });
      results.push({ email, success: !error, error: error?.message });
    } catch (err: any) {
      results.push({ email, success: false, error: err.message ?? "Unknown error" });
    }
  }
  return results;
}
