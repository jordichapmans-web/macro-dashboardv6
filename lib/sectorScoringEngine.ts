import { SeriesKey, SeriesPoint } from "./fred";
import { Quadrant, trend } from "./macroEngine";
import { SectorName, ALL_SECTORS } from "./etfDatabase";

export type SectorScore = {
  sector: SectorName;
  score: number; // 0-100
  baseline: number; // contribution from the Investment Clock quadrant
  driverAdjustment: number; // contribution from sector-specific real-time drivers
  driverNotes: string[]; // plain-language notes on what moved the score
};

/**
 * QUADRANT BASELINE MATRIX
 * -------------------------
 * Each cell is a starting affinity score (0-100) for how well that sector
 * historically performs in that Investment Clock quadrant. These are
 * illustrative, heuristic values grounded in standard sector-rotation and
 * Investment Clock guidance — not a backtested model. They give every
 * sector a transparent, disclosed starting point before real-time drivers
 * adjust it.
 */
const QUADRANT_BASELINE: Record<Quadrant, Record<SectorName, number>> = {
  Recovery: {
    Technology: 80,
    "Communication Services": 75,
    "Consumer Discretionary": 78,
    Industrials: 76,
    Financials: 68,
    Materials: 58,
    Energy: 50,
    "Real Estate": 65,
    Healthcare: 45,
    "Consumer Staples": 35,
    Utilities: 32,
  },
  Overheat: {
    Energy: 88,
    Materials: 84,
    Industrials: 70,
    Financials: 66,
    "Communication Services": 55,
    Healthcare: 52,
    "Consumer Staples": 48,
    Technology: 45,
    "Consumer Discretionary": 50,
    "Real Estate": 30,
    Utilities: 28,
  },
  Stagflation: {
    "Consumer Staples": 82,
    Healthcare: 80,
    Utilities: 68,
    Energy: 66,
    Materials: 55,
    "Communication Services": 40,
    Financials: 30,
    Technology: 28,
    "Consumer Discretionary": 26,
    Industrials: 30,
    "Real Estate": 25,
  },
  Reflation: {
    Utilities: 78,
    Healthcare: 75,
    "Consumer Staples": 72,
    "Real Estate": 62,
    Technology: 58,
    "Communication Services": 55,
    Financials: 32,
    Industrials: 30,
    Materials: 28,
    Energy: 26,
    "Consumer Discretionary": 40,
  },
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export function runSectorScoringEngine(
  data: Record<SeriesKey, SeriesPoint[]>,
  quadrant: Quadrant,
  dollarIndexTrend: "Rising" | "Falling" | null,
  growthSignal: "Rising" | "Falling"
): SectorScore[] {
  const baseline = QUADRANT_BASELINE[quadrant];

  // ---- Driver trends, computed once ----
  const oilTrend = trend(data.OIL, 126); // ~6 trading months
  const mortgageTrend = trend(data.MORTGAGE_30Y, 26); // ~6 months of weekly data
  const tenYearTrend = trend(data.TEN_YEAR_YIELD, 126);
  const fedFundsTrend = trend(data.FED_FUNDS, 6);
  const curveTrend = trend(data.YIELD_CURVE, 126); // steepening vs flattening
  const creditSpreadTrend = trend(data.CREDIT_SPREAD, 126); // widening vs narrowing

  const results: SectorScore[] = ALL_SECTORS.map((sector) => {
    let adj = 0;
    const notes: string[] = [];

    if (sector === "Energy") {
      if (oilTrend === "Rising") { adj += 12; notes.push("Oil trend rising (+12)"); }
      else if (oilTrend === "Falling") { adj -= 12; notes.push("Oil trend falling (-12)"); }
      if (dollarIndexTrend === "Falling") { adj += 8; notes.push("Dollar weakening supports commodity prices (+8)"); }
      else if (dollarIndexTrend === "Rising") { adj -= 8; notes.push("Dollar strengthening pressures commodity prices (-8)"); }
    }

    if (sector === "Materials") {
      if (dollarIndexTrend === "Falling") { adj += 6; notes.push("Weaker dollar supports materials prices (+6)"); }
      else if (dollarIndexTrend === "Rising") { adj -= 6; notes.push("Stronger dollar pressures materials prices (-6)"); }
      if (growthSignal === "Rising") { adj += 6; notes.push("Industrial production rising supports demand (+6)"); }
      else { adj -= 6; notes.push("Industrial production falling weighs on demand (-6)"); }
    }

    if (sector === "Real Estate") {
      if (mortgageTrend === "Falling") { adj += 15; notes.push("Mortgage rates falling (+15)"); }
      else if (mortgageTrend === "Rising") { adj -= 15; notes.push("Mortgage rates rising (-15)"); }
      if (tenYearTrend === "Falling") { adj += 10; notes.push("10-Year Treasury yield falling (+10)"); }
      else if (tenYearTrend === "Rising") { adj -= 10; notes.push("10-Year Treasury yield rising (-10)"); }
      if (fedFundsTrend === "Falling") { adj += 10; notes.push("Fed cutting rates (+10)"); }
      else if (fedFundsTrend === "Rising") { adj -= 10; notes.push("Fed raising rates (-10)"); }
    }

    if (sector === "Financials") {
      if (curveTrend === "Rising") { adj += 10; notes.push("Yield curve steepening — supports net interest margins (+10)"); }
      else if (curveTrend === "Falling") { adj -= 10; notes.push("Yield curve flattening/inverting — pressures margins (-10)"); }
      if (creditSpreadTrend === "Falling") { adj += 10; notes.push("Credit spreads narrowing — healthy credit conditions (+10)"); }
      else if (creditSpreadTrend === "Rising") { adj -= 10; notes.push("Credit spreads widening — credit stress building (-10)"); }
    }

    const base = baseline[sector];
    const score = clamp(Math.round(base + adj));

    return { sector, score, baseline: base, driverAdjustment: adj, driverNotes: notes };
  });

  return results.sort((a, b) => b.score - a.score);
}
