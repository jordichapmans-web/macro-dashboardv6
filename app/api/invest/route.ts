import { NextResponse } from "next/server";
import { fetchAllSeries } from "@/lib/fred";
import { runMacroEngine } from "@/lib/macroEngine";
import { runSectorScoringEngine } from "@/lib/sectorScoringEngine";
import { computeConfidence } from "@/lib/confidenceEngine";
import { ETF_DATABASE } from "@/lib/etfDatabase";
import { SECTOR_DRIVERS } from "@/lib/sectorDrivers";
import { SECTOR_RATIONALE } from "@/lib/sectorRationale";
import { HOLDING_HORIZON, REVIEW_TRIGGERS } from "@/lib/holdingHorizon";
import { HISTORICAL_ANALOGUES } from "@/lib/historicalAnalogues";
import { SUGGESTED_POSITIONING } from "@/lib/suggestedPositioning";
import { computeTacticalReadiness } from "@/lib/tacticalReadiness";
import { detectAndLogRegimeChange } from "@/lib/regimeLog";
import { trackTopSectorSince } from "@/lib/topSectorLog";

export const revalidate = 21600;

const PREFERRED_ASSET: Record<string, string> = {
  Recovery: "Stocks",
  Overheat: "Commodities",
  Stagflation: "Cash",
  Reflation: "Bonds",
};

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing FRED_API_KEY environment variable." }, { status: 500 });
  }

  try {
    const data = await fetchAllSeries(apiKey);
    const macro = runMacroEngine(data);
    const sectorScores = runSectorScoringEngine(
      data,
      macro.quadrant,
      macro.rawInputs.dollarIndexTrend,
      macro.growthSignal
    );
    const confidence = computeConfidence(macro);

    const enriched = sectorScores.map((s) => ({
      ...s,
      etfs: ETF_DATABASE[s.sector],
      drivers: SECTOR_DRIVERS[s.sector],
      rationale: SECTOR_RATIONALE[s.sector],
    }));

    const topSectors = enriched.slice(0, 3);

    // Tactical readiness only computed for the top 3 sectors, to keep this
    // endpoint fast — it's an external network call per sector.
    const tacticalReadiness = await Promise.all(
      topSectors.map((s) => computeTacticalReadiness(s.sector))
    );

    // Best-effort regime-change logging on every request too (not just the
    // cron job) — cheap no-op if nothing changed, and means the log stays
    // current even before the daily cron fires for the first time.
    let regimeChange = null;
    let topSectorSince: Record<string, string> = {};
    try {
      regimeChange = await detectAndLogRegimeChange(macro);
    } catch {
      // KV may not be configured yet — don't fail the whole page for it.
    }
    try {
      topSectorSince = await trackTopSectorSince(topSectors.map((s) => s.sector));
    } catch {
      // Same fallback — the page still works without this, just without the "since" date.
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      quadrant: macro.quadrant,
      economicCycleLabel: macro.economicCycleLabel,
      macroScore: macro.macroScore,
      preferredAssetClass: PREFERRED_ASSET[macro.quadrant],
      confidence,
      sectorScores: enriched,
      topSectors,
      tacticalReadiness,
      topSectorSince,
      holdingHorizon: HOLDING_HORIZON[macro.quadrant],
      reviewTriggers: REVIEW_TRIGGERS,
      historicalAnalogues: HISTORICAL_ANALOGUES[macro.quadrant],
      suggestedPositioning: SUGGESTED_POSITIONING[macro.quadrant],
      regimeChangeJustLogged: !!regimeChange,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 502 });
  }
}
