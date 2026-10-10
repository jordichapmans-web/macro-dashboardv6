import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { listSubscribers, subscribersToCsv } from "@/lib/subscribers";

export async function GET(req: NextRequest) {
  if (!(await isAuthorizedRequest(req))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const subscribers = await listSubscribers();
  const csv = subscribersToCsv(subscribers);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=subscribers.csv",
    },
  });
}
