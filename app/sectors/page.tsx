"use client";

import { PageShell, Card } from "@/components/PageShell";
import { useMacroData } from "@/lib/useMacroData";
import {
  EARLY_CYCLE_SECTORS,
  LATE_CYCLE_DEFENSIVE_SECTORS,
  FINANCIALS_NOTE,
  quadrantToRiskRegime,
  regimeExplanation,
} from "@/lib/sectorRotation";

export default function SectorsPage() {
  const { data, loading, error } = useMacroData();
  const regime = data ? quadrantToRiskRegime(data.quadrant) : null;

  return (
    <PageShell
      title="Sector Rotation"
      subtitle="Which sectors historically lead in a Risk-On vs. Risk-Off environment."
    >
      {loading && <p className="text-neutral-400 font-mono text-sm">Loading live data…</p>}
      {error && <p className="text-red-400 font-mono text-sm">{error}</p>}

      {regime && (
        <div
          className={`mb-8 rounded-xl border p-5 ${
            regime === "Risk-On" ? "border-[#4FBF8B]/40 bg-[#4FBF8B]/10" : "border-[#D9614F]/40 bg-[#D9614F]/10"
          }`}
        >
          <p className={`text-sm font-mono uppercase tracking-widest mb-1 ${regime === "Risk-On" ? "text-[#4FBF8B]" : "text-[#D9614F]"}`}>
            Current regime: {regime}
          </p>
          <p className="text-sm text-neutral-300">{regimeExplanation(regime)}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Early-cycle / risk-on leaders">
          <ul className="space-y-4">
            {EARLY_CYCLE_SECTORS.map((s) => (
              <li key={s.name} className={regime === "Risk-On" ? "opacity-100" : "opacity-50"}>
                <p className="text-sm font-medium text-neutral-100">{s.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{s.note}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Late-cycle / defensive leaders">
          <ul className="space-y-4">
            {LATE_CYCLE_DEFENSIVE_SECTORS.map((s) => (
              <li key={s.name} className={regime === "Risk-Off" ? "opacity-100" : "opacity-50"}>
                <p className="text-sm font-medium text-neutral-100">{s.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{s.note}</p>
              </li>
            ))}
          </ul>
        </Card>

        <div className="md:col-span-2">
          <Card title="A sector that sits apart: financials">
            <p className="text-sm text-neutral-300 leading-relaxed">{FINANCIALS_NOTE}</p>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
