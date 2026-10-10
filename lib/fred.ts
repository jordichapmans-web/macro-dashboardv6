/**
 * FRED API client
 * -----------------
 * FRED (Federal Reserve Economic Data) is free and public. Get a key at:
 * https://fred.stlouisfed.org/docs/api/api_key.html
 *
 * This is the ONLY place in the app that talks to FRED directly.
 * Everything else consumes the typed `SeriesPoint[]` this returns.
 */

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

export type SeriesPoint = {
  date: string; // YYYY-MM-DD
  value: number | null; // FRED uses "." for missing values
};

// The five series that back the v1 macro engine.
// Each maps to one leg of the Investment Clock model.
export const SERIES = {
  CPI: "CPIAUCSL", // Consumer Price Index, All Urban Consumers (inflation)
  UNEMPLOYMENT: "UNRATE", // Civilian Unemployment Rate
  YIELD_CURVE: "T10Y2Y", // 10-Year Treasury minus 2-Year Treasury spread
  INDUSTRIAL_PRODUCTION: "INDPRO", // Industrial Production Index (growth proxy)
  FED_FUNDS: "FEDFUNDS", // Effective Federal Funds Rate
  TEN_YEAR_YIELD: "DGS10", // 10-Year Treasury Constant Maturity Rate
  REAL_YIELD_5Y: "DFII5", // 5-Year Treasury Inflation-Indexed (real) yield
  DOLLAR_INDEX: "DTWEXBGS", // Trade Weighted U.S. Dollar Index: Broad
  OIL: "DCOILWTICO", // WTI Crude Oil price — drives the Energy sector score
  MORTGAGE_30Y: "MORTGAGE30US", // 30-Year Fixed Mortgage Rate — drives the Real Estate sector score
  CREDIT_SPREAD: "BAA10Y", // Moody's Baa Corporate Bond Yield minus 10Y Treasury — drives the Financials sector score
} as const;

export type SeriesKey = keyof typeof SERIES;

/**
 * Fetch a single FRED series as an ascending-date array.
 * `limit` is in observations (FRED default frequency for each series —
 * monthly for all five series above).
 */
/**
 * Fetch any FRED series by its raw ID string. This is the shared primitive
 * fetchSeries(key) below uses internally. It also lets us reach series
 * that aren't in the typed SERIES map above — specifically the
 * international OECD-mirrored rate/yield series used by the FX comparison
 * (lib/fxAnalysis.ts), without touching fetchSeries' existing signature or
 * behavior for any current caller.
 */
export async function fetchSeriesById(
  seriesId: string,
  apiKey: string,
  limit = 36
): Promise<SeriesPoint[]> {
  const url = new URL(FRED_BASE);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 * 6 },
  });

  if (!res.ok) {
    throw new Error(`FRED request failed for ${seriesId}: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  const points: SeriesPoint[] = (json.observations ?? []).map((obs: any) => ({
    date: obs.date,
    value: obs.value === "." ? null : parseFloat(obs.value),
  }));

  return points.reverse();
}

export async function fetchSeries(
  key: SeriesKey,
  apiKey: string,
  limit = 36 // ~3 years of monthly history — enough for YoY comparisons
): Promise<SeriesPoint[]> {
  const seriesId = SERIES[key];
  const url = new URL(FRED_BASE);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    // Cache on the server for 6 hours — FRED series update at most daily,
    // most of these monthly. No point hammering the API.
    next: { revalidate: 60 * 60 * 6 },
  });

  if (!res.ok) {
    throw new Error(
      `FRED request failed for ${seriesId}: ${res.status} ${res.statusText}`
    );
  }

  const json = await res.json();

  const points: SeriesPoint[] = (json.observations ?? []).map((obs: any) => ({
    date: obs.date,
    value: obs.value === "." ? null : parseFloat(obs.value),
  }));

  // FRED returns desc by construction here; flip to ascending for the engine.
  return points.reverse();
}

// Daily series need a bigger observation count than monthly ones to cover
// the same real-world time window (e.g. 6 trading months ≈ 126 points,
// vs. 6 calendar months ≈ 6 points for a monthly series).
const DAILY_SERIES: SeriesKey[] = ["TEN_YEAR_YIELD", "REAL_YIELD_5Y", "DOLLAR_INDEX", "OIL", "CREDIT_SPREAD"];
// Weekly series (mortgage rates are published every Thursday) need a
// mid-sized window — ~26 observations covers roughly 6 months.
const WEEKLY_SERIES: SeriesKey[] = ["MORTGAGE_30Y"];

/**
 * Fetch all series in parallel. This is the one call the API route makes.
 */
export async function fetchAllSeries(apiKey: string) {
  const keys = Object.keys(SERIES) as SeriesKey[];
  const results = await Promise.all(
    keys.map((k) =>
      fetchSeries(k, apiKey, DAILY_SERIES.includes(k) ? 400 : WEEKLY_SERIES.includes(k) ? 30 : 36)
    )
  );

  return Object.fromEntries(keys.map((k, i) => [k, results[i]])) as Record<
    SeriesKey,
    SeriesPoint[]
  >;
}
