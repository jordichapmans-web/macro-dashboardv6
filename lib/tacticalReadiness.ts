import { SectorName, ETF_DATABASE } from "./etfDatabase";

export type TacticalReadiness = {
  sector: SectorName;
  ticker: string;
  trend: "Strong" | "Improving" | "Neutral" | "Weak" | "Unavailable";
  entryStatus: "Ready" | "Watchlist" | "Wait for Pullback" | "Unavailable";
  aboveSMA200: boolean | null;
  momentum3moPct: number | null;
  note: string;
};

export type StooqRow = { date: string; close: number };

export async function fetchStooqDaily(ticker: string): Promise<StooqRow[]> {
  const url = `https://stooq.com/q/d/l/?s=${ticker.toLowerCase()}.us&i=d`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 6 } });
  if (!res.ok) throw new Error(`Stooq request failed for ${ticker}: ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split("\n").slice(1); // drop header row
  return lines
    .map((line) => {
      const [date, , , , close] = line.split(",");
      return { date, close: parseFloat(close) };
    })
    .filter((r) => !isNaN(r.close));
}

function sma(rows: StooqRow[], window: number): number | null {
  if (rows.length < window) return null;
  const slice = rows.slice(-window);
  return slice.reduce((sum, r) => sum + r.close, 0) / window;
}

export async function computeTacticalReadiness(sector: SectorName): Promise<TacticalReadiness> {
  const ticker = ETF_DATABASE[sector][0].ticker; // primary ETF for the sector

  try {
    const rows = await fetchStooqDaily(ticker);
    if (rows.length < 60) {
      return {
        sector, ticker, trend: "Unavailable", entryStatus: "Unavailable",
        aboveSMA200: null, momentum3moPct: null,
        note: "Not enough price history returned to compute a reliable signal.",
      };
    }

    const latestClose = rows[rows.length - 1].close;
    const sma200 = sma(rows, Math.min(200, rows.length));
    const threeMonthsAgo = rows[Math.max(0, rows.length - 63)].close;
    const momentum = ((latestClose - threeMonthsAgo) / threeMonthsAgo) * 100;
    const aboveSMA = sma200 != null ? latestClose > sma200 : null;

    let trend: TacticalReadiness["trend"];
    if (aboveSMA && momentum > 3) trend = "Strong";
    else if (aboveSMA && momentum <= 3) trend = "Improving";
    else if (!aboveSMA && momentum > 0) trend = "Neutral";
    else trend = "Weak";

    let entryStatus: TacticalReadiness["entryStatus"];
    if (trend === "Strong") entryStatus = "Ready";
    else if (trend === "Improving") entryStatus = "Watchlist";
    else if (trend === "Neutral") entryStatus = "Wait for Pullback";
    else entryStatus = "Watchlist";

    const note = `${ticker} is ${aboveSMA ? "above" : "below"} its 200-day average and ${momentum >= 0 ? "up" : "down"} ${Math.abs(momentum).toFixed(1)}% over 3 months.`;

    return { sector, ticker, trend, entryStatus, aboveSMA200: aboveSMA, momentum3moPct: momentum, note };
  } catch (err: any) {
    return {
      sector, ticker, trend: "Unavailable", entryStatus: "Unavailable",
      aboveSMA200: null, momentum3moPct: null,
      note: `Price data temporarily unavailable (${err.message}).`,
    };
  }
}
