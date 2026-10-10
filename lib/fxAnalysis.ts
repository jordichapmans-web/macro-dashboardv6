import { fetchSeriesById, SeriesPoint } from "./fred";
import { latest, trend } from "./macroEngine";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "NZD" | "CHF" | "AUD";

export const CURRENCIES: CurrencyCode[] = ["USD", "EUR", "GBP", "JPY", "CAD", "NZD", "CHF", "AUD"];

// FRED series IDs. US uses the Federal Reserve's own series (already used
// elsewhere in this platform). The other seven use FRED's mirror of OECD
// Main Economic Indicators, which follows a consistent, verifiable naming
// convention (IRSTCI01/IR3TIB01/etc. for short-term rates, IRLTLT01 for
// 10-year government bond yields) — confirmed series per currency below.
// Each is fetched independently and wrapped in its own try/catch: if one
// series ID is ever wrong or discontinued, that one row shows "unavailable"
// rather than breaking the page.
const CURRENCY_SERIES: Record<CurrencyCode, { shortRateId: string; shortRateLabel: string; longBondId: string }> = {
  USD: { shortRateId: "FEDFUNDS", shortRateLabel: "Fed Funds Rate", longBondId: "DGS10" },
  EUR: { shortRateId: "ECBDFR", shortRateLabel: "ECB Deposit Facility Rate", longBondId: "IRLTLT01EZM156N" },
  GBP: { shortRateId: "IR3TIB01GBM156N", shortRateLabel: "3M Interbank Rate", longBondId: "IRLTLT01GBM156N" },
  JPY: { shortRateId: "IR3TCD01JPM156N", shortRateLabel: "3M CD Rate", longBondId: "IRLTLT01JPM156N" },
  CAD: { shortRateId: "IRSTCI01CAM156N", shortRateLabel: "Interbank Rate", longBondId: "IRLTLT01CAM156N" },
  NZD: { shortRateId: "IRSTCI01NZM156N", shortRateLabel: "Interbank Rate", longBondId: "IRLTLT01NZM156N" },
  CHF: { shortRateId: "IR3TED01CHM156N", shortRateLabel: "3M Eurodollar Deposit Rate", longBondId: "IRLTLT01CHM156N" },
  AUD: { shortRateId: "IRSTCI01AUM156N", shortRateLabel: "Interbank Rate", longBondId: "IRLTLT01AUM156N" },
};

export type CurrencyAnalysis = {
  code: CurrencyCode;
  shortRateLabel: string;
  shortRate: number | null;
  shortRateTrend: "Rising" | "Falling" | null;
  longBondYield: number | null;
  longBondTrend: "Rising" | "Falling" | null;
  strengthScore: number | null; // relative to the 8-currency average; higher = stronger carry appeal
  direction: "Strengthening" | "Weakening" | "Neutral" | "Unavailable";
};

async function safeFetch(seriesId: string, apiKey: string, limit: number): Promise<SeriesPoint[] | null> {
  try {
    return await fetchSeriesById(seriesId, apiKey, limit);
  } catch {
    return null;
  }
}

export async function analyzeCurrencies(apiKey: string): Promise<CurrencyAnalysis[]> {
  const raw = await Promise.all(
    CURRENCIES.map(async (code) => {
      const cfg = CURRENCY_SERIES[code];
      const [shortSeries, longSeries] = await Promise.all([
        safeFetch(cfg.shortRateId, apiKey, 24),
        safeFetch(cfg.longBondId, apiKey, 24),
      ]);
      const shortRate = shortSeries ? latest(shortSeries)?.value ?? null : null;
      const shortRateTrend = shortSeries ? trend(shortSeries, 6) : null;
      const longBondYield = longSeries ? latest(longSeries)?.value ?? null : null;
      const longBondTrend = longSeries ? trend(longSeries, 6) : null;
      return { code, shortRateLabel: cfg.shortRateLabel, shortRate, shortRateTrend, longBondYield, longBondTrend };
    })
  );

  // Strength score: how this currency's short rate compares to the
  // 8-currency average (the core carry-trade driver already explained
  // elsewhere on this page), plus a small tilt for the trend direction of
  // both the short rate and the long bond yield.
  const validShortRates = raw.filter((r) => r.shortRate != null).map((r) => r.shortRate as number);
  const avgShortRate = validShortRates.length
    ? validShortRates.reduce((a, b) => a + b, 0) / validShortRates.length
    : null;

  return raw.map((r) => {
    if (r.shortRate == null || avgShortRate == null) {
      return { ...r, strengthScore: null, direction: "Unavailable" as const };
    }
    const levelComponent = r.shortRate - avgShortRate;
    const trendComponent =
      (r.shortRateTrend === "Rising" ? 0.5 : r.shortRateTrend === "Falling" ? -0.5 : 0) +
      (r.longBondTrend === "Rising" ? 0.25 : r.longBondTrend === "Falling" ? -0.25 : 0);
    const strengthScore = Math.round((levelComponent + trendComponent) * 100) / 100;

    const direction =
      r.shortRateTrend === "Rising" && r.longBondTrend !== "Falling"
        ? ("Strengthening" as const)
        : r.shortRateTrend === "Falling" && r.longBondTrend !== "Rising"
        ? ("Weakening" as const)
        : ("Neutral" as const);

    return { ...r, strengthScore, direction };
  });
}

export type FxPair = {
  pair: string;
  base: CurrencyCode;
  quote: CurrencyCode;
  divergence: number | null;
  direction: "Strong Bullish" | "Bullish" | "Neutral" | "Bearish" | "Strong Bearish" | "Unavailable";
  volatilityPotential: "High" | "Medium" | "Low" | "Unavailable";
  explanation: string;
};

// Fixed precedence order so pair names match real-world FX convention
// (EUR/USD rather than USD/EUR, etc.) — not a calculation, just naming.
const PRECEDENCE: CurrencyCode[] = ["EUR", "GBP", "AUD", "NZD", "USD", "CAD", "CHF", "JPY"];

export function rankFxPairs(currencies: CurrencyAnalysis[]): FxPair[] {
  const byCode = Object.fromEntries(currencies.map((c) => [c.code, c])) as Record<CurrencyCode, CurrencyAnalysis>;
  const pairs: FxPair[] = [];

  for (let i = 0; i < PRECEDENCE.length; i++) {
    for (let j = i + 1; j < PRECEDENCE.length; j++) {
      const base = PRECEDENCE[i];
      const quote = PRECEDENCE[j];
      const a = byCode[base];
      const b = byCode[quote];

      if (a.strengthScore == null || b.strengthScore == null) {
        pairs.push({
          pair: `${base}/${quote}`, base, quote, divergence: null,
          direction: "Unavailable", volatilityPotential: "Unavailable",
          explanation: "Insufficient data for one or both currencies.",
        });
        continue;
      }

      const divergence = Math.round((a.strengthScore - b.strengthScore) * 100) / 100;
      const direction =
        divergence > 1.5 ? "Strong Bullish" : divergence > 0.5 ? "Bullish" :
        divergence < -1.5 ? "Strong Bearish" : divergence < -0.5 ? "Bearish" : "Neutral";
      const absD = Math.abs(divergence);
      const volatilityPotential = absD > 1.5 ? "High" : absD > 0.6 ? "Medium" : "Low";

      pairs.push({
        pair: `${base}/${quote}`, base, quote, divergence, direction, volatilityPotential,
        explanation: `${base} macro strength score ${a.strengthScore} vs ${quote} at ${b.strengthScore} — a ${absD.toFixed(2)}-point divergence.`,
      });
    }
  }

  return pairs.sort((x, y) => Math.abs(y.divergence ?? 0) - Math.abs(x.divergence ?? 0));
}
