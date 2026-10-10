import { NextRequest, NextResponse } from "next/server";
import { addSubscriber } from "@/lib/subscribers";
import { sendConfirmationEmail } from "@/lib/email";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    await addSubscriber(email);

    // Best-effort: don't fail the signup if the confirmation email has an
    // issue (e.g. Resend not fully configured yet) — the subscription
    // itself already succeeded.
    let confirmationSent = false;
    try {
      const result = await sendConfirmationEmail(email);
      confirmationSent = result.success;
    } catch {
      confirmationSent = false;
    }

    return NextResponse.json({ success: true, confirmationSent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
