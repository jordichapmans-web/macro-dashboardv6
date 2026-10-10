import { NextResponse } from "next/server";
import { analyzeCurrencies, rankFxPairs } from "@/lib/fxAnalysis";

export const revalidate = 21600;

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing FRED_API_KEY environment variable." }, { status: 500 });
  }

  try {
    const currencies = await analyzeCurrencies(apiKey);
    const pairs = rankFxPairs(currencies);
    return NextResponse.json({ generatedAt: new Date().toISOString(), currencies, pairs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 502 });
  }
}
