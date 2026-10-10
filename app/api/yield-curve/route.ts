import { NextResponse } from "next/server";
import { fetchSeries } from "@/lib/fred";

export const revalidate = 21600;

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing FRED_API_KEY environment variable." }, { status: 500 });
  }

  try {
    const [curve, tenYear, fedFunds] = await Promise.all([
      fetchSeries("YIELD_CURVE", apiKey, 260), // ~1 year of daily data
      fetchSeries("TEN_YEAR_YIELD", apiKey, 260),
      fetchSeries("FED_FUNDS", apiKey, 24), // monthly, ~2 years
    ]);

    // Merge by date for a single chart-friendly array.
    const byDate = new Map<string, { date: string; spread?: number; tenYear?: number; fedFunds?: number }>();
    curve.forEach((p) => {
      if (p.value != null) byDate.set(p.date, { ...(byDate.get(p.date) ?? { date: p.date }), spread: p.value });
    });
    tenYear.forEach((p) => {
      if (p.value != null) byDate.set(p.date, { ...(byDate.get(p.date) ?? { date: p.date }), tenYear: p.value });
    });

    // Fed funds is monthly — forward-fill it across the daily dates so the
    // chart can draw it as a flat step line alongside the daily series.
    const sortedFedFunds = fedFunds.filter((p) => p.value != null);
    const points = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
    for (const point of points) {
      const applicable = [...sortedFedFunds].reverse().find((f) => f.date <= point.date);
      if (applicable?.value != null) point.fedFunds = applicable.value;
    }

    return NextResponse.json({ points });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 502 });
  }
}
