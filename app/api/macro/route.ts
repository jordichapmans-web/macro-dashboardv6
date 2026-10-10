import { NextResponse } from "next/server";
import { fetchAllSeries } from "@/lib/fred";
import { runMacroEngine } from "@/lib/macroEngine";

// Re-run at most every 6 hours per deployment (matches FRED's own update
// cadence for these monthly series) — see the `next.revalidate` option in fred.ts.
export const revalidate = 21600;

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing FRED_API_KEY environment variable. See README.md." },
      { status: 500 }
    );
  }

  try {
    const data = await fetchAllSeries(apiKey);
    const result = runMacroEngine(data);
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Unknown error fetching macro data" },
      { status: 502 }
    );
  }
}
