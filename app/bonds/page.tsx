"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { PageShell, Card } from "@/components/PageShell";
import { useMacroData } from "@/lib/useMacroData";

const RATINGS = [
  { grade: "AAA", tier: "Investment Grade", note: "Highest quality, lowest yield." },
  { grade: "AA", tier: "Investment Grade", note: "Very high quality." },
  { grade: "A", tier: "Investment Grade", note: "High quality, more sensitive to conditions." },
  { grade: "BBB", tier: "Investment Grade", note: "Lowest rung still considered investment grade." },
  { grade: "BB", tier: "Junk / High Yield", note: "Speculative — higher return demanded for credit risk." },
  { grade: "B", tier: "Junk / High Yield", note: "Speculative." },
  { grade: "CCC", tier: "Junk / High Yield", note: "Substantial credit risk." },
  { grade: "CC", tier: "Junk / High Yield", note: "Very high credit risk." },
  { grade: "C", tier: "Junk / High Yield", note: "Near default." },
  { grade: "D", tier: "Junk / High Yield", note: "In default." },
];

function useYieldCurveHistory() {
  const [points, setPoints] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/yield-curve")
      .then((r) => r.json())
      .then((json) => (json.error ? setError(json.error) : setPoints(json.points)))
      .catch((e) => setError(e.message));
  }, []);
  return { points, error };
}

export default function BondsPage() {
  const { data } = useMacroData();
  const { points, error } = useYieldCurveHistory();

  return (
    <PageShell
      title="Bonds & Recession Risk"
      subtitle="The 10Y-2Y yield curve, compared against the Fed Funds Rate, is one of the most reliable recession signals."
    >
      {data?.recession && (
        <div
          className={`mb-8 rounded-xl border p-5 ${
            data.recession.warning ? "border-[#D9614F]/40 bg-[#D9614F]/10" : "border-[#4FBF8B]/40 bg-[#4FBF8B]/10"
          }`}
        >
          <p className={`text-sm font-mono uppercase tracking-widest mb-1 ${data.recession.warning ? "text-[#D9614F]" : "text-[#4FBF8B]"}`}>
            {data.recession.warning ? "Recession warning active" : "No recession warning"}
          </p>
          <p className="text-sm text-neutral-300">{data.recession.explanation}</p>
        </div>
      )}

      <Card title="10Y-2Y spread vs. Fed Funds Rate (last ~12 months)" className="mb-8">
        {error && <p className="text-red-400 font-mono text-sm">{error}</p>}
        {!points && !error && <p className="text-neutral-400 font-mono text-sm">Loading chart data…</p>}
        {points && (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8B95A1" }} minTickGap={40} />
              <YAxis tick={{ fontSize: 10, fill: "#8B95A1" }} />
              <Tooltip contentStyle={{ background: "#0B0F14", border: "1px solid #333", fontSize: 12 }} />
              <ReferenceLine y={0} stroke="#8B95A1" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="spread" name="10Y-2Y spread" stroke="#5B8FD9" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="fedFunds" name="Fed Funds Rate" stroke="#E0A83E" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        )}
        <p className="text-xs text-neutral-500 mt-3">
          When the blue spread line drops below zero while the amber Fed Funds line sits above the 10-year yield, that combination has historically preceded most U.S. recessions.
        </p>
      </Card>

      <Card title="Credit rating scale — investment grade vs. junk">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          {RATINGS.map((r) => (
            <div key={r.grade} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
              <span className="font-mono text-sm text-neutral-100 w-12">{r.grade}</span>
              <span
                className={`text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded ${
                  r.tier === "Investment Grade" ? "text-[#4FBF8B] bg-[#4FBF8B]/10" : "text-[#D9614F] bg-[#D9614F]/10"
                }`}
              >
                {r.tier}
              </span>
              <span className="text-xs text-neutral-400 flex-1 text-right">{r.note}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-4">
          Junk bonds demand a higher yield precisely because their creditworthiness is lower than investment-grade debt — the extra yield compensates for the extra default risk.
        </p>
      </Card>
    </PageShell>
  );
}
