"use client";

import Link from "next/link";
import { InvestmentClockDial } from "./InvestmentClockDial";
import { PageShell, Card } from "./PageShell";
import { Tooltip } from "./Tooltip";
import { useMacroData } from "@/lib/useMacroData";
import { MACRO_SCORE_EXPLANATION, ALLOCATION_TILT_EXPLANATION, ALLOCATION_TILT_DISCLAIMER } from "@/lib/explanations";

function ScoreGauge({ score }: { score: number }) {
  const pct = (score + 100) / 2;
  const color = score > 15 ? "#4FBF8B" : score < -15 ? "#D9614F" : "#E0A83E";
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 flex items-center">
          Macro Score
          <Tooltip text={MACRO_SCORE_EXPLANATION} width="w-72" />
        </span>
        <span className="text-3xl font-mono font-semibold" style={{ color }}>{score > 0 ? `+${score}` : score}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between mt-1 text-[10px] font-mono text-neutral-500">
        <span>BEARISH</span>
        <span>NEUTRAL</span>
        <span>BULLISH</span>
      </div>
    </div>
  );
}

function TiltPill({ assetClass, tilt }: { assetClass: string; tilt: string }) {
  const color = tilt === "Overweight" ? "#4FBF8B" : tilt === "Underweight" ? "#D9614F" : "#8B95A1";
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
      <span className="text-sm text-neutral-200">{assetClass}</span>
      <span className="flex items-center gap-0.5">
        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color, backgroundColor: `${color}1A` }}>
          {tilt.toUpperCase()}
        </span>
        <Tooltip text={ALLOCATION_TILT_EXPLANATION[tilt as "Overweight" | "Neutral" | "Underweight"]} />
      </span>
    </div>
  );
}

function SignalRow({ label, value, good, neutral = false }: { label: string; value: string; good: boolean; neutral?: boolean }) {
  const dot = neutral ? "🟡" : good ? "🟢" : "🔴";
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-400">{label}</span>
      <span className="flex items-center gap-1.5 text-neutral-200">
        <span>{dot}</span>
        <span className="font-mono text-xs">{value}</span>
      </span>
    </div>
  );
}

export default function MacroDashboard() {
  const { data, loading, error } = useMacroData();

  return (
    <PageShell
      title="Dashboard"
      subtitle="What is happening in the global economy, right now."
    >
      {loading && <p className="text-neutral-400 font-mono text-sm">Loading live FRED data…</p>}
      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300 font-mono">
          {error}
        </div>
      )}

      {data && !error && (
        <>
          <Link
            href="/invest"
            className="mb-6 flex items-center justify-between rounded-xl border border-neutral-700 bg-gradient-to-r from-neutral-800 to-neutral-900 px-6 py-4 hover:border-neutral-500 transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-neutral-100">📈 What should I invest in?</p>
              <p className="text-xs text-neutral-400 mt-0.5">See ranked sectors, ETF ideas, and the confidence score behind them</p>
            </div>
            <span className="text-neutral-500 group-hover:text-neutral-300 transition-colors">→</span>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Economic Cycle">
            <div className="flex flex-col items-center">
              <InvestmentClockDial quadrant={data.quadrant} />
              <p className="text-sm text-neutral-300 mt-4 text-center">{data.economicCycleLabel}</p>
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card title="Composite Macro Score">
              <ScoreGauge score={data.macroScore} />
            </Card>
            <Card title="Asset Allocation Tilt">
              {data.assetAllocationTilt.map((t) => (
                <TiltPill key={t.assetClass} assetClass={t.assetClass} tilt={t.tilt} />
              ))}
              <p className="text-[11px] text-neutral-600 mt-3">{ALLOCATION_TILT_DISCLAIMER}</p>
            </Card>
          </div>

          <Card title="Sector Rotation (Investment Clock)">
            <div className="mb-4">
              <p className="text-xs font-mono text-[#4FBF8B] mb-2">FAVOR</p>
              <div className="flex flex-wrap gap-2">
                {data.sectorRotation.favor.map((s) => (
                  <span key={s} className="text-xs rounded-full border border-[#4FBF8B]/40 text-[#4FBF8B] px-3 py-1">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono text-[#D9614F] mb-2">AVOID</p>
              <div className="flex flex-wrap gap-2">
                {data.sectorRotation.avoid.map((s) => (
                  <span key={s} className="text-xs rounded-full border border-[#D9614F]/40 text-[#D9614F] px-3 py-1">{s}</span>
                ))}
              </div>
            </div>
          </Card>

          <div className="md:col-span-3">
            <Card title="Macro Signals">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                <SignalRow label="Growth" good={data.growthSignal === "Rising"} value={data.growthSignal} />
                <SignalRow label="Inflation" good={data.inflationSignal === "Falling"} value={data.inflationSignal} />
                <SignalRow label="Employment" good={data.rawInputs.unemploymentTrend === "Falling"} value={data.rawInputs.unemploymentTrend ?? "n/a"} />
                <SignalRow label="Yield Curve" good={!data.recession.curveInverted} value={data.recession.curveInverted ? "Inverted" : "Positive"} />
                <SignalRow label="Fed Policy" good={data.rawInputs.fedFundsRate != null} value={data.rawInputs.fedFundsRate != null ? `${data.rawInputs.fedFundsRate.toFixed(2)}%` : "n/a"} neutral />
                <SignalRow label="Dollar" good={data.rawInputs.dollarIndexTrend === "Falling"} value={data.rawInputs.dollarIndexTrend ?? "n/a"} neutral />
              </div>
            </Card>
          </div>

          {data.recession.warning && (
            <div className="md:col-span-3 rounded-xl border border-[#D9614F]/40 bg-[#D9614F]/10 p-4 text-sm text-[#D9614F]">
              ⚠ Recession warning active — see the Bonds &amp; Recession Risk page for detail.
            </div>
          )}

          <div className="md:col-span-3">
            <Card title="Why the score changed — full explanation">
              <ul className="space-y-2">
                {data.explanations.map((e, i) => (
                  <li key={i} className="text-sm text-neutral-300 leading-relaxed flex gap-2">
                    <span className="text-neutral-600 font-mono">{String(i + 1).padStart(2, "0")}</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          </div>
        </>
      )}

      <footer className="mt-10 text-xs text-neutral-600 font-mono">
        Educational macro analysis only — not investment advice. Data: Federal Reserve Economic Data (FRED).
      </footer>
    </PageShell>
  );
}
