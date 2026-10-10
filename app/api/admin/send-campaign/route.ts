import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { listSubscribers } from "@/lib/subscribers";
import { sendCampaign } from "@/lib/email";
import { appendCampaignLog } from "@/lib/campaignLog";

export async function POST(req: NextRequest) {
  if (!(await isAuthorizedRequest(req))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const { subject, body, target, selectedEmails, confirmed } = await req.json();

    if (!confirmed) {
      return NextResponse.json({ error: "Sending requires explicit confirmation." }, { status: 400 });
    }
    if (!subject || !body) {
      return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
    }

    const all = await listSubscribers();
    const recipients =
      target === "all"
        ? all.map((s) => s.email)
        : (selectedEmails as string[] ?? []).filter((e) => all.some((s) => s.email === e));

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No valid recipients selected." }, { status: 400 });
    }

    const results = await sendCampaign(recipients, subject, body);
    const sentAt = new Date().toISOString();
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    try {
      await appendCampaignLog({ sentAt, subject, target, succeeded, failed });
    } catch {
      // Don't fail the response if logging has an issue — the emails already sent.
    }

    return NextResponse.json({
      sentAt,
      succeeded,
      failed,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
