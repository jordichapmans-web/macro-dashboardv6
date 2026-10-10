import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { fetchAllSeries } from "@/lib/fred";
import { runMacroEngine } from "@/lib/macroEngine";
import { runSectorScoringEngine } from "@/lib/sectorScoringEngine";
import { getRegimeLog } from "@/lib/regimeLog";
import { generateDraftEmail } from "@/lib/emailTemplate";

export async function GET(req: NextRequest) {
  if (!(await isAuthorizedRequest(req))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing FRED_API_KEY." }, { status: 500 });

  try {
    const [data, log] = await Promise.all([fetchAllSeries(apiKey), getRegimeLog(1)]);
    const macro = runMacroEngine(data);
    const sectorScores = runSectorScoringEngine(data, macro.quadrant, macro.rawInputs.dollarIndexTrend, macro.growthSignal);
    const latestEntry = log[0] ?? null;

    const draft = latestEntry ? generateDraftEmail(latestEntry, sectorScores.slice(0, 3)) : null;

    return NextResponse.json({ latestEntry, draft, topSectors: sectorScores.slice(0, 3) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 502 });
  }
}
