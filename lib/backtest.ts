import { fetchSeries, SeriesKey, SeriesPoint } from "./fred";
import { runMacroEngine, Quadrant } from "./macroEngine";
import { SUGGESTED_POSITIONING } from "./suggestedPositioning";
import { fetchStooqDaily } from "./tacticalReadiness";

// Real ETF proxies with genuinely long, real Stooq history — matches the
// asset categories requested (equities, bonds, gold, energy, tech, financials).
// Earliest reliable inception date noted for honesty in the UI.
const PERFORMANCE_ASSETS: { label: string; ticker: string; availableFrom: string }[] = [
  { label: "S&P 500 (SPY)", ticker: "SPY", availableFrom: "1993-02-01" },
  { label: "Bonds (TLT)", ticker: "TLT", availableFrom: "2002-07-01" },
  { label: "Gold (GLD)", ticker: "GLD", availableFrom: "2004-11-01" },
  { label: "Energy (XLE)", ticker: "XLE", availableFrom: "1998-12-01" },
  { label: "Technology (XLK)", ticker: "XLK", availableFrom: "1998-12-01" },
  { label: "Financials (XLF)", ticker: "XLF", availableFrom: "1998-12-01" },
];

const HORIZON_MONTHS = [3, 6, 9, 12, 24];

// Series needed to reconstruct the macro engine's inputs as of a past date.
// Same keys as the live engine — nothing new invented here.
const BACKTEST_SERIES_KEYS: SeriesKey[] = [
  "CPI", "UNEMPLOYMENT", "YIELD_CURVE", "INDUSTRIAL_PRODUCTION", "FED_FUNDS",
  "TEN_YEAR_YIELD", "REAL_YIELD_5Y", "DOLLAR_INDEX", "OIL", "MORTGAGE_30Y", "CREDIT_SPREAD",
];

function sliceAsOf(series: SeriesPoint[], cutoff: string): SeriesPoint[] {
  return series.filter((p) => p.date <= cutoff);
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

async function priceNear(rows: { date: string; close: number }[], targetDate: string): Promise<number | null> {
  // Find the closest trading day on or after the target date (markets are
  // closed weekends/holidays, so an exact date match is unreliable).
  const match = rows.find((r) => r.date >= targetDate);
  return match?.close ?? null;
}

export type BacktestResult = {
  cutoffDate: string;
  quadrant: Quadrant;
  economicCycleLabel: string;
  macroScore: number;
  suggestedPositioning: { label: string; tilt: string }[];
  performance: {
    asset: string;
    ticker: string;
    horizons: { months: number; targetDate: string; pctChange: number | null; note?: string }[];
  }[];
  summary: string;
};

export async function runBacktest(cutoffDate: string, fredApiKey: string): Promise<BacktestResult> {
  // Fetch generous historical windows for every series the live engine
  // uses — same series, same fetchSeries function, just a bigger limit so
  // we can truncate at an arbitrary past date. This does not change how
  // any series is fetched or interpreted.
  const seriesData = await Promise.all(
    BACKTEST_SERIES_KEYS.map(async (key) => {
      const isDaily = ["YIELD_CURVE", "TEN_YEAR_YIELD", "REAL_YIELD_5Y", "DOLLAR_INDEX", "OIL", "CREDIT_SPREAD"].includes(key);
      const limit = isDaily ? 15000 : 800; // enough to reach back to the 1990s+
      const full = await fetchSeries(key, fredApiKey, limit);
      return [key, sliceAsOf(full, cutoffDate)] as const;
    })
  );
  const truncated = Object.fromEntries(seriesData) as Record<SeriesKey, SeriesPoint[]>;

  // The exact same engine the live dashboard uses — zero modification.
  const macro = runMacroEngine(truncated);

  // Subsequent real performance, per asset, per horizon.
  const performance = await Promise.all(
    PERFORMANCE_ASSETS.map(async (asset) => {
      if (cutoffDate < asset.availableFrom) {
        return {
          asset: asset.label,
          ticker: asset.ticker,
          horizons: HORIZON_MONTHS.map((m) => ({
            months: m,
            targetDate: addMonths(cutoffDate, m),
            pctChange: null,
            note: `No price history available before ${asset.availableFrom.slice(0, 7)}.`,
          })),
        };
      }

      try {
        const rows = await fetchStooqDaily(asset.ticker);
        const startPrice = await priceNear(rows, cutoffDate);
        const today = new Date().toISOString().slice(0, 10);

        const horizons = await Promise.all(
          HORIZON_MONTHS.map(async (m) => {
            const targetDate = addMonths(cutoffDate, m);
            if (targetDate > today) {
              return { months: m, targetDate, pctChange: null, note: "This date is in the future." };
            }
            const endPrice = await priceNear(rows, targetDate);
            if (!startPrice || !endPrice) {
              return { months: m, targetDate, pctChange: null, note: "Price data unavailable for this window." };
            }
            return { months: m, targetDate, pctChange: ((endPrice - startPrice) / startPrice) * 100 };
          })
        );

        return { asset: asset.label, ticker: asset.ticker, horizons };
      } catch (err: any) {
        return {
          asset: asset.label,
          ticker: asset.ticker,
          horizons: HORIZON_MONTHS.map((m) => ({
            months: m, targetDate: addMonths(cutoffDate, m), pctChange: null, note: "Price data temporarily unavailable.",
          })),
        };
      }
    })
  );

  const twelveMoSp500 = performance.find((p) => p.ticker === "SPY")?.horizons.find((h) => h.months === 12);
  const twelveMoBonds = performance.find((p) => p.ticker === "TLT")?.horizons.find((h) => h.months === 12);

  const summary =
    `At ${cutoffDate}, the model identified a ${macro.quadrant} regime. ` +
    (twelveMoSp500?.pctChange != null
      ? `Over the following 12 months, the S&P 500 (SPY) ${twelveMoSp500.pctChange >= 0 ? "gained" : "lost"} ${Math.abs(twelveMoSp500.pctChange).toFixed(1)}%`
      : "12-month S&P 500 data isn't available for this date") +
    (twelveMoBonds?.pctChange != null
      ? `, while long-duration bonds (TLT) ${twelveMoBonds.pctChange >= 0 ? "gained" : "lost"} ${Math.abs(twelveMoBonds.pctChange).toFixed(1)}%.`
      : ".");

  return {
    cutoffDate,
    quadrant: macro.quadrant,
    economicCycleLabel: macro.economicCycleLabel,
    macroScore: macro.macroScore,
    suggestedPositioning: SUGGESTED_POSITIONING[macro.quadrant],
    performance,
    summary,
  };
}
