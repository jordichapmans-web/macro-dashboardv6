import { NextRequest, NextResponse } from "next/server";
import { fetchAllSeries } from "@/lib/fred";
import { runMacroEngine } from "@/lib/macroEngine";
import { detectAndLogRegimeChange } from "@/lib/regimeLog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Optional shared-secret check so this endpoint can't be hammered by
  // strangers — set CRON_SECRET in Vercel and add it as a header in your
  // Vercel Cron config. If you haven't set one yet, this check is skipped.
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const provided = req.headers.get("authorization");
    if (provided !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Not authorized." }, { status: 401 });
    }
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing FRED_API_KEY." }, { status: 500 });

  try {
    const data = await fetchAllSeries(apiKey);
    const macro = runMacroEngine(data);
    const change = await detectAndLogRegimeChange(macro);

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      quadrant: macro.quadrant,
      changeDetected: !!change,
      change,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 502 });
  }
}
