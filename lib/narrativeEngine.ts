import { fetchAllSeries, fetchSeries } from "./fred";
import { runMacroEngine } from "./macroEngine";
import { runSectorScoringEngine } from "./sectorScoringEngine";
import { analyzeCurrencies } from "./fxAnalysis";
import { trend, latest } from "./macroEngine";
import { RiskAssetId, RISK_ASSETS } from "./narrativeAssets";

export type KeyMetric = { name: string; value: number; bias: "Bullish" | "Bearish" | "Neutral"; detail: string };

export type Scenario = {
  label: "Bullish" | "Base" | "Bearish";
  expectedOutcome: string;
  reasoning: string[];
  confirmConditions: string[];
  negateConditions: string[];
};

export type NarrativeSet = {
  id: string;
  assetId: RiskAssetId;
  assetLabel: string;
  createdAt: string;
  keyMetric: KeyMetric;
  scenarios: Scenario[];
  status: "Unresolved" | "Confirmed" | "Negated";
  confirmedScenario?: "Bullish" | "Base" | "Bearish";
  evaluations: { date: string; keyMetric: KeyMetric; result: "Confirmed" | "Negated" | "Still unresolved"; scenario: string; evidence: string }[];
};

/**
 * Pulls the single real metric that drives scenario generation and later
 * evaluation for a given asset, reusing the exact engines already live
 * elsewhere in this platform (macro engine, sector scoring engine, FX
 * analysis) — nothing new is calculated here, just read and interpreted
 * per-asset.
 */
export async function fetchKeyMetric(assetId: RiskAssetId, apiKey: string): Promise<KeyMetric> {
  switch (assetId) {
    case "sp500": {
      const data = await fetchAllSeries(apiKey);
      const macro = runMacroEngine(data);
      const bias = macro.macroScore > 15 ? "Bullish" : macro.macroScore < -15 ? "Bearish" : "Neutral";
      return { name: "Composite Macro Score", value: macro.macroScore, bias, detail: `${macro.quadrant} regime` };
    }
    case "gold": {
      const data = await fetchAllSeries(apiKey);
      const ry = data.REAL_YIELD_5Y ? latest(data.REAL_YIELD_5Y)?.value ?? null : null;
      const value = ry ?? 0;
      const bias = ry != null ? (ry < 1.0 ? "Bullish" : ry > 2.0 ? "Bearish" : "Neutral") : "Neutral";
      return { name: "5Y Real Yield", value, bias, detail: ry != null ? `${ry.toFixed(2)}%` : "unavailable" };
    }
    case "oil": {
      const oilSeries = await fetchSeries("OIL", apiKey, 400);
      const oilTrend = trend(oilSeries, 126);
      const value = latest(oilSeries)?.value ?? 0;
      const bias = oilTrend === "Rising" ? "Bullish" : oilTrend === "Falling" ? "Bearish" : "Neutral";
      return { name: "WTI Oil Price", value, bias, detail: `${oilTrend ?? "flat"}, $${value.toFixed(2)}/bbl` };
    }
    case "dxy": {
      const dxySeries = await fetchSeries("DOLLAR_INDEX", apiKey, 400);
      const dxyTrend = trend(dxySeries, 126);
      const value = latest(dxySeries)?.value ?? 0;
      const bias = dxyTrend === "Rising" ? "Bullish" : dxyTrend === "Falling" ? "Bearish" : "Neutral";
      return { name: "Dollar Index trend", value, bias, detail: `${dxyTrend ?? "flat"}, ${value.toFixed(1)}` };
    }
    case "eurusd": {
      const currencies = await analyzeCurrencies(apiKey);
      const eur = currencies.find((c) => c.code === "EUR");
      const usd = currencies.find((c) => c.code === "USD");
      const diff = eur?.strengthScore != null && usd?.strengthScore != null ? eur.strengthScore - usd.strengthScore : 0;
      const bias = diff > 0.5 ? "Bullish" : diff < -0.5 ? "Bearish" : "Neutral";
      return { name: "EUR vs USD strength differential", value: diff, bias, detail: `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}` };
    }
    case "technology_sector":
    case "energy_sector": {
      const sectorName = assetId === "technology_sector" ? "Technology" : "Energy";
      const data = await fetchAllSeries(apiKey);
      const macro = runMacroEngine(data);
      const scores = runSectorScoringEngine(data, macro.quadrant, macro.rawInputs.dollarIndexTrend, macro.growthSignal);
      const row = scores.find((s) => s.sector === sectorName)!;
      const bias = row.score > 65 ? "Bullish" : row.score < 45 ? "Bearish" : "Neutral";
      return { name: `${sectorName} Sector Score`, value: row.score, bias, detail: row.driverNotes.join("; ") || "quadrant baseline only" };
    }
    case "long_duration_bonds": {
      const data = await fetchAllSeries(apiKey);
      const yieldTrend = data.TEN_YEAR_YIELD ? trend(data.TEN_YEAR_YIELD, 126) : null;
      const value = data.TEN_YEAR_YIELD ? latest(data.TEN_YEAR_YIELD)?.value ?? 0 : 0;
      // Falling long yields => rising bond prices => bullish for bond holders.
      const bias = yieldTrend === "Falling" ? "Bullish" : yieldTrend === "Rising" ? "Bearish" : "Neutral";
      return { name: "10Y Treasury Yield trend", value, bias, detail: `${yieldTrend ?? "flat"}, ${value.toFixed(2)}%` };
    }
  }
}

export async function generateScenarios(assetId: RiskAssetId, apiKey: string): Promise<{ keyMetric: KeyMetric; scenarios: Scenario[] }> {
  const keyMetric = await fetchKeyMetric(assetId, apiKey);
  const asset = RISK_ASSETS.find((a) => a.id === assetId)!;

  const scenarios: Scenario[] = [
    {
      label: "Bullish",
      expectedOutcome: `${asset.label} extends higher / strengthens.`,
      reasoning: [
        `${keyMetric.name} currently reads ${keyMetric.detail}.`,
        keyMetric.bias === "Bullish"
          ? "This metric is currently supportive of a bullish outcome."
          : "This is the scenario where the current signal reverses in a bullish direction.",
      ],
      confirmConditions: [`${keyMetric.name} continues trending in the bullish direction over the next data releases.`],
      negateConditions: [`${keyMetric.name} reverses sharply against this reading.`],
    },
    {
      label: "Base",
      expectedOutcome: `${asset.label} trades in a range / continues its current trajectory without a sharp break.`,
      reasoning: [
        `${keyMetric.name} currently reads ${keyMetric.detail} — the base case assumes this holds roughly steady.`,
      ],
      confirmConditions: [`${keyMetric.name} stays within a similar range, without a decisive break either direction.`],
      negateConditions: [`${keyMetric.name} moves decisively in either direction.`],
    },
    {
      label: "Bearish",
      expectedOutcome: `${asset.label} declines / weakens.`,
      reasoning: [
        `${keyMetric.name} currently reads ${keyMetric.detail}.`,
        keyMetric.bias === "Bearish"
          ? "This metric is currently supportive of a bearish outcome."
          : "This is the scenario where the current signal reverses in a bearish direction.",
      ],
      confirmConditions: [`${keyMetric.name} continues trending in the bearish direction over the next data releases.`],
      negateConditions: [`${keyMetric.name} reverses sharply against this reading.`],
    },
  ];

  return { keyMetric, scenarios };
}

/**
 * Re-fetches the same key metric and determines whether the originally
 * generated scenarios are confirmed, negated, or still unresolved. This is
 * what the daily cron job (and the manual "check for updates" button)
 * calls for every open narrative.
 */
export async function evaluateNarrative(narrative: NarrativeSet, apiKey: string): Promise<NarrativeSet> {
  const fresh = await fetchKeyMetric(narrative.assetId, apiKey);
  const originalBias = narrative.keyMetric.bias;

  let result: "Confirmed" | "Negated" | "Still unresolved";
  let matchedScenario: "Bullish" | "Base" | "Bearish";

  if (fresh.bias === originalBias && fresh.bias !== "Neutral") {
    result = "Confirmed";
    matchedScenario = originalBias as "Bullish" | "Bearish";
  } else if (fresh.bias !== "Neutral" && originalBias !== "Neutral" && fresh.bias !== originalBias) {
    result = "Negated";
    matchedScenario = fresh.bias as "Bullish" | "Bearish";
  } else {
    result = "Still unresolved";
    matchedScenario = "Base";
  }

  const evidence = `${fresh.name} now reads ${fresh.detail} (was ${narrative.keyMetric.detail} at generation).`;

  const updated: NarrativeSet = {
    ...narrative,
    status: result === "Confirmed" ? "Confirmed" : result === "Negated" ? "Negated" : "Unresolved",
    confirmedScenario: result !== "Still unresolved" ? matchedScenario : undefined,
    evaluations: [
      { date: new Date().toISOString(), keyMetric: fresh, result, scenario: matchedScenario, evidence },
      ...narrative.evaluations,
    ],
  };

  return updated;
}
