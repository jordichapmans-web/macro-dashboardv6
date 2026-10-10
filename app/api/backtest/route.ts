import { NextRequest, NextResponse } from "next/server";
import { runBacktest } from "@/lib/backtest";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing FRED_API_KEY environment variable." }, { status: 500 });
  }

  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Provide a date in YYYY-MM-DD format." }, { status: 400 });
  }

  const earliest = "1990-01-01";
  const today = new Date().toISOString().slice(0, 10);
  if (date < earliest || date > today) {
    return NextResponse.json({ error: `Please choose a date between ${earliest} and today.` }, { status: 400 });
  }

  try {
    const result = await runBacktest(date, apiKey);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 502 });
  }
}
