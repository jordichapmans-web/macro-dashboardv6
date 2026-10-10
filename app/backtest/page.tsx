"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { PageShell, Card } from "@/components/PageShell";
import { InfoBanner } from "@/components/InfoBanner";

type Horizon = { months: number; targetDate: string; pctChange: number | null; note?: string };
type PerformanceRow = { asset: string; ticker: string; horizons: Horizon[] };
type BacktestResponse = {
  cutoffDate: string;
  quadrant: string;
  economicCycleLabel: string;
  macroScore: number;
  suggestedPositioning: { label: string; tilt: string }[];
  performance: PerformanceRow[];
  summary: string;
  error?: string;
};

const PRESET_DATES = [
  { label: "Jan 2000 (dot-com peak)", date: "2000-01-01" },
  { label: "Jan 2008 (pre-crisis)", date: "2008-01-01" },
  { label: "Jan 2020 (pre-pandemic)", date: "2020-01-01" },
  { label: "Jan 2022 (rate hikes begin)", date: "2022-01-01" },
];

export default function BacktestPage() {
  const [date, setDate] = useState("2020-01-01");
  const [data, setData] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runBacktest(selectedDate: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/backtest?date=${selectedDate}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setData(json);
      setDate(selectedDate);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const chartData = data?.performance
    .find((p) => p.ticker === "SPY")
    ?.horizons.map((h) => ({ name: `${h.months}mo`, value: h.pctChange }));

  return (
    <PageShell
      title="Backtest strategy"
      subtitle="See how today's macro model would have classified a past date, and what actually happened afterward."
    >
      <InfoBanner>
        This demonstrates how the existing macro model behaved historically — it does not guarantee future
        results. Past performance of any asset or regime is not predictive of what will happen next.
      </InfoBanner>

      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="date"
            value={date}
            min="1990-01-01"
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-md text-sm px-3 py-2 text-neutral-100"
          />
          <button
            onClick={() => runBacktest(date)}
            disabled={loading}
            className="rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm px-4 py-2 text-neutral-100 disabled:opacity-50"
          >
            {loading ? "Running…" : "Run backtest"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_DATES.map((p) => (
            <button
              key={p.date}
              onClick={() => runBacktest(p.date)}
              className="text-xs rounded-full border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 px-3 py-1"
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-600 mt-4">
          Full data coverage from 1999 onward. Gold (from Nov 2004) and Bonds/TLT (from Jul 2002) become
          available a bit later — earlier dates will show those specific rows as unavailable rather than
          guessed figures.
        </p>
      </Card>

      {error && <p className="text-red-400 font-mono text-sm mb-6">{error}</p>}

      {data && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card title="Historical regime">
              <p className="text-lg font-semibold text-neutral-100">{data.quadrant}</p>
              <p className="text-xs text-neutral-400 mt-1">{data.economicCycleLabel}</p>
            </Card>
            <Card title="Macro score at the time">
              <p className="text-2xl font-mono font-semibold text-neutral-100">{data.macroScore}</p>
            </Card>
            <Card title="As of">
              <p className="text-lg font-mono text-neutral-100">{data.cutoffDate}</p>
            </Card>
          </div>

          <Card title="Historical suggested positioning" className="mb-8">
            <p className="text-xs text-neutral-500 mb-3">
              What the same live recommendation engine would have suggested on this date.
            </p>
            <ul className="space-y-2">
              {data.suggestedPositioning.map((p) => (
                <li key={p.label} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-300">{p.label}</span>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{
                      color: p.tilt === "Overweight" ? "#4FBF8B" : p.tilt === "Underweight" ? "#D9614F" : "#8B95A1",
                      backgroundColor: p.tilt === "Overweight" ? "#4FBF8B1A" : p.tilt === "Underweight" ? "#D9614F1A" : "#8B95A11A",
                    }}
                  >
                    {p.tilt.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {chartData && (
            <Card title="S&P 500 (SPY) performance after this date" className="mb-8">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8B95A1" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#8B95A1" }} unit="%" />
                  <RechartsTooltip contentStyle={{ background: "#0B0F14", border: "1px solid #333", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.value != null && d.value >= 0 ? "#4FBF8B" : "#D9614F"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card title="Historical performance — all assets" className="mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs text-neutral-500 border-b border-neutral-800">
                    <th className="py-2 pr-4">Asset</th>
                    {data.performance[0]?.horizons.map((h) => (
                      <th key={h.months} className="py-2 pr-4 font-mono">{h.months}mo</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.performance.map((row) => (
                    <tr key={row.ticker} className="border-b border-neutral-800 last:border-0">
                      <td className="py-2 pr-4 text-neutral-200">{row.asset}</td>
                      {row.horizons.map((h) => (
                        <td key={h.months} className="py-2 pr-4 font-mono">
                          {h.pctChange != null ? (
                            <span className={h.pctChange >= 0 ? "text-[#4FBF8B]" : "text-[#D9614F]"}>
                              {h.pctChange >= 0 ? "+" : ""}{h.pctChange.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-neutral-600 text-xs" title={h.note}>N/A</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Historical summary">
            <p className="text-sm text-neutral-300 leading-relaxed">{data.summary}</p>
          </Card>
        </>
      )}
    </PageShell>
  );
}
