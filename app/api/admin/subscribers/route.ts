import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { listSubscribers, removeSubscriber } from "@/lib/subscribers";

export async function GET(req: NextRequest) {
  if (!(await isAuthorizedRequest(req))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const subscribers = await listSubscribers();
  return NextResponse.json({ subscribers });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthorizedRequest(req))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email." }, { status: 400 });
  await removeSubscriber(email);
  return NextResponse.json({ success: true });
}
