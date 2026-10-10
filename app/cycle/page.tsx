"use client";

import { PageShell, Card } from "@/components/PageShell";
import { InvestmentClockDial } from "@/components/InvestmentClockDial";
import { useMacroData } from "@/lib/useMacroData";
import type { Quadrant } from "@/lib/macroEngine";

const QUADRANT_DETAIL: Record<
  Quadrant,
  { growth: string; inflation: string; bestAsset: string; bestEquities: string; curveSlope: string }
> = {
  Reflation: {
    growth: "Down",
    inflation: "Down",
    bestAsset: "Bonds",
    bestEquities: "Defensive Growth",
    curveSlope: "Bull steepening",
  },
  Recovery: {
    growth: "Up (recovering)",
    inflation: "Still down",
    bestAsset: "Stocks",
    bestEquities: "Cyclical Growth",
    curveSlope: "Not applicable",
  },
  Overheat: {
    growth: "Up",
    inflation: "Up (rising)",
    bestAsset: "Commodities",
    bestEquities: "Cyclical Value",
    curveSlope: "Bear flattening",
  },
  Stagflation: {
    growth: "Down (weakening)",
    inflation: "Still up",
    bestAsset: "Cash",
    bestEquities: "Defensive Value",
    curveSlope: "Not applicable",
  },
};

const ORDER: Quadrant[] = ["Reflation", "Recovery", "Overheat", "Stagflation"];

export default function CyclePage() {
  const { data, loading, error } = useMacroData();

  return (
    <PageShell
      title="Economic Cycle"
      subtitle="The Merrill Lynch Investment Clock — four quadrants of growth and inflation, and where the current data places us."
    >
      {loading && <p className="text-neutral-400 font-mono text-sm">Loading live data…</p>}
      {error && <p className="text-red-400 font-mono text-sm">{error}</p>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card title="Current Phase">
            <div className="flex flex-col items-center">
              <InvestmentClockDial quadrant={data.quadrant} />
            </div>
          </Card>
          <Card title="Why we're here">
            <ul className="space-y-2">
              {data.explanations.slice(0, 4).map((e, i) => (
                <li key={i} className="text-sm text-neutral-300 leading-relaxed">{e}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ORDER.map((q) => {
          const d = QUADRANT_DETAIL[q];
          const isCurrent = data?.quadrant === q;
          return (
            <Card key={q} className={isCurrent ? "border-neutral-500" : ""}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-neutral-100">{q}</h3>
                {isCurrent && (
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full bg-neutral-700 text-neutral-200">
                    Current
                  </span>
                )}
              </div>
              <dl className="text-sm space-y-1.5 text-neutral-300">
                <div className="flex justify-between"><dt className="text-neutral-500">Growth</dt><dd>{d.growth}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Inflation</dt><dd>{d.inflation}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Best asset class</dt><dd className="font-medium text-neutral-100">{d.bestAsset}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Best equity style</dt><dd>{d.bestEquities}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Yield curve slope</dt><dd>{d.curveSlope}</dd></div>
              </dl>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
