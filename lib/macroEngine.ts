import { SeriesPoint, SeriesKey } from "./fred";

/**
 * MACRO ENGINE — v1
 * ------------------
 * This is intentionally a simplified, transparent starting model —
 * exactly the kind of thing a v1 should be. It implements one well-known,
 * publicly documented framework (the Merrill Lynch Investment Clock) using
 * five real inputs. It is NOT the full multi-factor model described in the
 * platform vision (that also ingests PMI, COT reports, credit spreads,
 * liquidity measures, and NLP-derived signal from central bank statements —
 * those are v2+ additions once this core loop is proven).
 *
 * Every number this module produces comes with a plain-language reason.
 * Nothing here is a black box, and nothing here predicts prices — it only
 * classifies the current macro regime.
 */

export type Quadrant = "Recovery" | "Overheat" | "Stagflation" | "Reflation";

export type MacroResult = {
  macroScore: number; // -100 (very bearish for risk assets) .. +100 (very bullish)
  growthSignal: "Rising" | "Falling";
  inflationSignal: "Rising" | "Falling";
  quadrant: Quadrant;
  economicCycleLabel: string;
  sectorRotation: { favor: string[]; avoid: string[] };
  assetAllocationTilt: { assetClass: string; tilt: "Overweight" | "Underweight" | "Neutral" }[];
  explanations: string[];
  rawInputs: {
    cpiYoY: number | null;
    unemploymentRate: number | null;
    unemploymentTrend: "Rising" | "Falling" | null;
    yieldCurveSpread: number | null;
    industrialProductionYoY: number | null;
    fedFundsRate: number | null;
    tenYearYield: number | null;
    realYield5Y: number | null;
    dollarIndexTrend: "Rising" | "Falling" | null;
  };
  recession: {
    curveInverted: boolean; // T10Y2Y < 0
    shortRateAboveLongRate: boolean; // Fed Funds > 10Y yield — the "chart below fed funds line" signal
    warning: boolean; // both conditions true
    explanation: string;
  };
};

export function latest(series: SeriesPoint[]): SeriesPoint | undefined {
  return [...series].reverse().find((p) => p.value !== null);
}

export function monthsAgo(series: SeriesPoint[], n: number): SeriesPoint | undefined {
  const clean = series.filter((p) => p.value !== null);
  const idx = clean.length - 1 - n;
  return idx >= 0 ? clean[idx] : undefined;
}

function yoyChange(series: SeriesPoint[]): number | null {
  const now = latest(series);
  const yearAgo = monthsAgo(series, 12);
  if (!now?.value || !yearAgo?.value) return null;
  return ((now.value - yearAgo.value) / Math.abs(yearAgo.value)) * 100;
}

export function trend(series: SeriesPoint[], lookbackMonths = 6): "Rising" | "Falling" | null {
  const now = latest(series);
  const then = monthsAgo(series, lookbackMonths);
  if (now?.value == null || then?.value == null) return null;
  return now.value > then.value ? "Rising" : "Falling";
}

export function runMacroEngine(
  data: Record<SeriesKey, SeriesPoint[]>
): MacroResult {
  const explanations: string[] = [];

  // ---- Inflation signal (CPI YoY trend) ----
  const cpiYoYNow = yoyChange(data.CPI);
  const cpiSeriesYoY = data.CPI.map((_, i, arr) =>
    i >= 12 && arr[i].value != null && arr[i - 12].value != null
      ? ((arr[i].value! - arr[i - 12].value!) / Math.abs(arr[i - 12].value!)) * 100
      : null
  );
  const cpiYoY6moAgo = cpiSeriesYoY.filter((v) => v !== null).slice(-7)[0] ?? null;
  const inflationSignal: "Rising" | "Falling" =
    cpiYoYNow != null && cpiYoY6moAgo != null && cpiYoYNow > cpiYoY6moAgo
      ? "Rising"
      : "Falling";

  explanations.push(
    cpiYoYNow != null
      ? `CPI is running at ${cpiYoYNow.toFixed(1)}% year-over-year and has been ${inflationSignal.toLowerCase()} over the last 6 months.`
      : `CPI data unavailable — inflation signal defaulted to Falling.`
  );

  // ---- Growth signal (Industrial Production YoY trend) ----
  const indproYoY = yoyChange(data.INDUSTRIAL_PRODUCTION);
  const growthSignal: "Rising" | "Falling" = indproYoY != null && indproYoY > 0 ? "Rising" : "Falling";
  explanations.push(
    indproYoY != null
      ? `Industrial production is ${growthSignal.toLowerCase()}, at ${indproYoY.toFixed(1)}% year-over-year — used here as the growth proxy.`
      : `Industrial production data unavailable — growth signal defaulted to Falling.`
  );

  // ---- Yield curve (10Y-2Y) ----
  const curveNow = latest(data.YIELD_CURVE)?.value ?? null;
  if (curveNow != null) {
    explanations.push(
      curveNow < 0
        ? `The 10Y-2Y yield curve is inverted (${curveNow.toFixed(2)}), historically a recession warning.`
        : `The 10Y-2Y yield curve is positive (${curveNow.toFixed(2)}), not currently signaling recession risk.`
    );
  }

  // ---- Unemployment ----
  const unemploymentNow = latest(data.UNEMPLOYMENT)?.value ?? null;
  const unemploymentTrend = trend(data.UNEMPLOYMENT, 6);
  if (unemploymentNow != null) {
    explanations.push(
      `Unemployment is at ${unemploymentNow.toFixed(1)}% and has been ${unemploymentTrend?.toLowerCase() ?? "flat"} over 6 months.`
    );
  }

  // ---- Fed funds rate ----
  const fedFundsNow = latest(data.FED_FUNDS)?.value ?? null;
  const fedFundsTrend = trend(data.FED_FUNDS, 6);
  if (fedFundsNow != null) {
    explanations.push(
      `The effective Fed Funds Rate is ${fedFundsNow.toFixed(2)}% and has been ${fedFundsTrend?.toLowerCase() ?? "flat"} over 6 months.`
    );
  }

  // ---- Investment Clock quadrant (Merrill Lynch framework) ----
  let quadrant: Quadrant;
  if (growthSignal === "Rising" && inflationSignal === "Falling") quadrant = "Recovery";
  else if (growthSignal === "Rising" && inflationSignal === "Rising") quadrant = "Overheat";
  else if (growthSignal === "Falling" && inflationSignal === "Rising") quadrant = "Stagflation";
  else quadrant = "Reflation";

  const cycleLabels: Record<Quadrant, string> = {
    Recovery: "Early-cycle Recovery — growth accelerating, inflation contained",
    Overheat: "Late-cycle Overheat — growth strong, inflation building",
    Stagflation: "Stagflation — growth slowing, inflation still elevated",
    Reflation: "Reflation / Slowdown — growth and inflation both soft, policy easing likely",
  };

  const sectorMap: Record<Quadrant, { favor: string[]; avoid: string[] }> = {
    Recovery: { favor: ["Industrials", "Technology", "Consumer Discretionary", "Financials"], avoid: ["Utilities", "Consumer Staples"] },
    Overheat: { favor: ["Energy", "Materials", "Commodities"], avoid: ["Long-duration Bonds", "Growth Tech"] },
    Stagflation: { favor: ["Consumer Staples", "Healthcare", "Gold"], avoid: ["Consumer Discretionary", "Financials"] },
    Reflation: { favor: ["Government Bonds", "Utilities", "Quality/Defensive Equities"], avoid: ["Commodities", "Cyclicals"] },
  };

  const allocationMap: Record<Quadrant, { assetClass: string; tilt: "Overweight" | "Underweight" | "Neutral" }[]> = {
    Recovery: [
      { assetClass: "Equities", tilt: "Overweight" },
      { assetClass: "Bonds", tilt: "Underweight" },
      { assetClass: "Commodities", tilt: "Neutral" },
      { assetClass: "Cash", tilt: "Underweight" },
    ],
    Overheat: [
      { assetClass: "Equities", tilt: "Neutral" },
      { assetClass: "Bonds", tilt: "Underweight" },
      { assetClass: "Commodities", tilt: "Overweight" },
      { assetClass: "Cash", tilt: "Neutral" },
    ],
    Stagflation: [
      { assetClass: "Equities", tilt: "Underweight" },
      { assetClass: "Bonds", tilt: "Underweight" },
      { assetClass: "Commodities", tilt: "Overweight" },
      { assetClass: "Cash", tilt: "Overweight" },
    ],
    Reflation: [
      { assetClass: "Equities", tilt: "Underweight" },
      { assetClass: "Bonds", tilt: "Overweight" },
      { assetClass: "Commodities", tilt: "Underweight" },
      { assetClass: "Cash", tilt: "Neutral" },
    ],
  };

  explanations.push(
    `Growth is ${growthSignal} and inflation is ${inflationSignal} → this places the cycle in the "${quadrant}" quadrant of the Investment Clock.`
  );

  // ---- Composite Macro Score (-100..100) ----
  // A simple, transparent weighted sum — deliberately not a "model" that
  // needs a black box to explain. Each component is capped to [-1, 1]
  // before weighting so no single series can dominate.
  let score = 0;
  const weights = { growth: 30, inflation: -20, curve: 25, unemployment: -15, policy: -10 };

  score += (growthSignal === "Rising" ? 1 : -1) * weights.growth;
  score += (inflationSignal === "Rising" ? 1 : -1) * weights.inflation;
  if (curveNow != null) score += Math.max(-1, Math.min(1, curveNow)) * weights.curve;
  if (unemploymentTrend) score += (unemploymentTrend === "Rising" ? -1 : 1) * Math.abs(weights.unemployment);
  if (fedFundsTrend) score += (fedFundsTrend === "Rising" ? -1 : 1) * Math.abs(weights.policy);

  const macroScore = Math.max(-100, Math.min(100, Math.round(score)));

  explanations.push(
    `Composite Macro Score: ${macroScore} — combines growth, inflation, yield curve, unemployment trend, and policy trend, each with a fixed, disclosed weight.`
  );

  // ---- Recession signal ----
  // Per the classic inverted-yield-curve heuristic: plot the 10Y-2Y spread
  // alongside the Fed Funds Rate. Two confirming conditions:
  //  1. The spread itself is negative (curve inverted)
  //  2. The Fed Funds Rate sits above the 10Y yield (short rate > long rate)
  // Either alone is a caution flag; both together is the classic warning.
  const tenYearNow = latest(data.TEN_YEAR_YIELD)?.value ?? null;
  const curveInverted = curveNow != null && curveNow < 0;
  const shortRateAboveLongRate =
    fedFundsNow != null && tenYearNow != null && fedFundsNow > tenYearNow;
  const recessionWarning = curveInverted && shortRateAboveLongRate;

  const recessionExplanation = recessionWarning
    ? `The yield curve is inverted (10Y-2Y = ${curveNow!.toFixed(2)}) AND the Fed Funds Rate (${fedFundsNow!.toFixed(2)}%) sits above the 10-year yield (${tenYearNow!.toFixed(2)}%) — historically this combination has preceded most U.S. recessions.`
    : curveInverted
    ? `The yield curve is inverted (10Y-2Y = ${curveNow!.toFixed(2)}), a caution signal, but the Fed Funds Rate has not yet risen above the 10-year yield — the classic double-confirmation isn't in place.`
    : `The yield curve is not inverted (10Y-2Y = ${curveNow?.toFixed(2) ?? "n/a"}) — no recession warning from this signal.`;

  explanations.push(recessionExplanation);

  // ---- Real yield (5Y TIPS) — the main driver behind gold's moves ----
  const realYield5Y = latest(data.REAL_YIELD_5Y)?.value ?? null;
  if (realYield5Y != null) {
    explanations.push(
      `The 5-year real yield (TIPS-based) is ${realYield5Y.toFixed(2)}% — ${
        realYield5Y > 1.5
          ? "high enough that safe government debt is competing hard with gold for allocation."
          : "low enough that gold's lack of yield is less of a disadvantage versus bonds."
      }`
    );
  }

  // ---- Dollar index trend ----
  const dollarIndexTrend = trend(data.DOLLAR_INDEX, 126); // ~6 trading months
  if (dollarIndexTrend) {
    explanations.push(
      `The broad trade-weighted Dollar Index has been ${dollarIndexTrend.toLowerCase()} over the past ~6 months.`
    );
  }

  return {
    macroScore,
    growthSignal,
    inflationSignal,
    quadrant,
    economicCycleLabel: cycleLabels[quadrant],
    sectorRotation: sectorMap[quadrant],
    assetAllocationTilt: allocationMap[quadrant],
    explanations,
    rawInputs: {
      cpiYoY: cpiYoYNow,
      unemploymentRate: unemploymentNow,
      unemploymentTrend,
      yieldCurveSpread: curveNow,
      industrialProductionYoY: indproYoY,
      fedFundsRate: fedFundsNow,
      tenYearYield: tenYearNow,
      realYield5Y,
      dollarIndexTrend,
    },
    recession: {
      curveInverted,
      shortRateAboveLongRate,
      warning: recessionWarning,
      explanation: recessionExplanation,
    },
  };
}
