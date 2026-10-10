"use client";

import { useEffect, useState } from "react";
import { PageShell, Card } from "@/components/PageShell";
import { InfoBanner } from "@/components/InfoBanner";
import { Tooltip } from "@/components/Tooltip";
import { SubscribeForm } from "@/components/SubscribeForm";
import { REFRESH_CADENCE } from "@/lib/dataStatus";
import { ALLOCATION_TILT_EXPLANATION, ALLOCATION_TILT_DISCLAIMER, sectorScoreBandExplanation } from "@/lib/explanations";
import { POSITIONING_ASSETS } from "@/lib/positioningAssets";

type SectorScoreDto = {
  sector: string;
  score: number;
  baseline: number;
  driverAdjustment: number;
  driverNotes: string[];
  etfs: { ticker: string; name: string }[];
  drivers: string[];
  rationale: string;
};

type TacticalDto = {
  sector: string;
  ticker: string;
  trend: string;
  entryStatus: string;
  note: string;
};

type InvestResponse = {
  generatedAt: string;
  quadrant: string;
  economicCycleLabel: string;
  macroScore: number;
  preferredAssetClass: string;
  confidence: { score: number; checks: { label: string; passed: boolean }[] };
  sectorScores: SectorScoreDto[];
  topSectors: SectorScoreDto[];
  tacticalReadiness: TacticalDto[];
  topSectorSince: Record<string, string>;
  holdingHorizon: { typicalPeriod: string; reviewFrequency: string };
  reviewTriggers: string[];
  historicalAnalogues: { period: string; narrative: string; bestSectors: string[]; worstSectors: string[] }[];
  suggestedPositioning: { label: string; tilt: string }[];
  error?: string;
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "#4FBF8B" : score >= 45 ? "#E0A83E" : "#D9614F";
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="h-2 flex-1 rounded-full bg-neutral-800 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-mono w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

function ReadinessBadge({ status }: { status: string }) {
  const color =
    status === "Ready" ? "#4FBF8B" : status === "Watchlist" ? "#E0A83E" : status === "Wait for Pullback" ? "#8B95A1" : "#D9614F";
  return (
    <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded" style={{ color, backgroundColor: `${color}1A` }}>
      {status}
    </span>
  );
}

export default function InvestPage() {
  const [data, setData] = useState<InvestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [positioningOpen, setPositioningOpen] = useState<string | null>(null);
  const [tacticalOpen, setTacticalOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/invest")
      .then((r) => r.json())
      .then((json) => (json.error ? setError(json.error) : setData(json)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell
      title="What should I invest in?"
      subtitle="Current regime → ranked sectors → ETF ideas, with a confidence score and implementation guidance behind every step."
    >
      {loading && <p className="text-neutral-400 font-mono text-sm">Loading live data…</p>}
      {error && <p className="text-red-400 font-mono text-sm">{error}</p>}

      {data && (
        <>
          <InfoBanner>
            <strong className="text-neutral-100">Macro recommendations are not immediate buy signals.</strong>{" "}
            They identify sectors and asset classes that have historically outperformed during the current
            economic regime. Consider trend confirmation, valuation, and portfolio risk before entering a
            position — see Tactical Readiness below for a timing-focused read.
          </InfoBanner>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card title="Current regime">
              <p className="text-lg font-semibold text-neutral-100 flex items-center">
                {data.quadrant}
                <Tooltip term="Macro Regime" />
              </p>
              <p className="text-xs text-neutral-400 mt-1">{data.economicCycleLabel}</p>
            </Card>
            <Card title="Preferred asset class">
              <p className="text-lg font-semibold text-neutral-100 flex items-center">
                {data.preferredAssetClass}
                <Tooltip term="Preferred Asset Class" />
              </p>
              <p className="text-xs text-neutral-400 mt-1">Per the Investment Clock model for this quadrant</p>
            </Card>
            <Card title="Macro confidence">
              <p className="text-3xl font-mono font-semibold text-neutral-100 flex items-center">
                {data.confidence.score}%
                <Tooltip term="Confidence Score" />
              </p>
              <ul className="mt-3 space-y-1">
                {data.confidence.checks.map((c, i) => (
                  <li key={i} className="text-xs flex items-center gap-2">
                    <span className={c.passed ? "text-[#4FBF8B]" : "text-[#D9614F]"}>{c.passed ? "✅" : "❌"}</span>
                    <span className="text-neutral-400">{c.label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card title="Why these sectors?" className="mb-8">
            <p className="text-sm text-neutral-300 leading-relaxed mb-4 flex items-start gap-1">
              The preferred asset class (<strong className="text-neutral-100">{data.preferredAssetClass}</strong>)
              is the highest-level allocation the Investment Clock suggests. The sectors below are
              <span className="mx-1 flex items-center">equity proxies<Tooltip term="Equity Proxy" /></span>
              — stock market sectors that have historically captured similar performance, for investors who
              primarily invest through equities rather than buying commodities, bonds, or currencies directly.
            </p>
            <div className="space-y-3">
              {data.topSectors.map((s) => (
                <details key={s.sector} className="group rounded-lg border border-neutral-800 p-3">
                  <summary className="cursor-pointer text-sm text-neutral-100 flex items-center justify-between">
                    {s.sector}
                    <span className="text-neutral-500 text-xs group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{s.rationale}</p>
                </details>
              ))}
            </div>
          </Card>

          <Card title="Implementation guidance" className="mb-8">
            <p className="text-sm text-neutral-300 leading-relaxed">
              Macro regimes are <strong className="text-neutral-100">strategic portfolio allocation signals</strong> —
              they identify areas that have historically outperformed during similar economic environments. They
              are not short-term trading signals. Combine this macro outlook with trend analysis, valuation, and
              your own risk management before initiating any position.
            </p>
          </Card>

          <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-400 mb-4">Top 3 sectors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {data.topSectors.map((s, i) => {
              const raw = data.tacticalReadiness[i];
              // Per spec: if there isn't enough data for a reliable signal,
              // omit the tactical readiness element entirely — no error text.
              const tactical = raw && raw.trend !== "Unavailable" && raw.entryStatus !== "Unavailable" ? raw : null;
              const since = data.topSectorSince?.[s.sector];
              return (
                <Card key={s.sector} title={s.sector}>
                  <p className="text-2xl font-mono font-semibold text-neutral-100 mb-2">{s.score}</p>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-3">{sectorScoreBandExplanation(s.score)}</p>
                  <table className="w-full text-sm mb-3">
                    <tbody>
                      {s.etfs.map((e) => (
                        <tr key={e.ticker} className="border-b border-neutral-800 last:border-0">
                          <td className="py-1.5 font-mono text-neutral-100 w-16">{e.ticker}</td>
                          <td className="py-1.5 text-neutral-400">{e.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {since && (
                    <p className="text-[11px] text-neutral-600 mb-2">
                      Top-sector recommendation active since {new Date(since).toLocaleDateString()}
                    </p>
                  )}
                  {tactical && (
                    <button
                      onClick={() => setTacticalOpen(tacticalOpen === s.sector ? null : s.sector)}
                      className="w-full flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-800 pt-2"
                    >
                      <span className="flex items-center gap-1">
                        Tactical readiness
                        <Tooltip term="Tactical Readiness" />
                      </span>
                      <ReadinessBadge status={tactical.entryStatus} />
                    </button>
                  )}
                  {tactical && tacticalOpen === s.sector && (
                    <div className="mt-2 text-xs text-neutral-500">
                      <p>Trend: <span className="text-neutral-300">{tactical.trend}</span></p>
                      <p className="text-neutral-600 mt-1">{tactical.note}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Card title="Suggested positioning">
              <p className="text-xs text-neutral-500 mb-3">A translation of the macro model — not personalized investment advice.</p>
              <ul className="space-y-1">
                {data.suggestedPositioning.map((p) => {
                  const assets = POSITIONING_ASSETS[p.label];
                  const isOpen = positioningOpen === p.label;
                  return (
                    <li key={p.label} className="border-b border-neutral-800 last:border-0">
                      <button
                        onClick={() => assets && setPositioningOpen(isOpen ? null : p.label)}
                        className="w-full flex items-center justify-between text-sm py-2"
                      >
                        <span className="text-neutral-300 flex items-center gap-1">
                          {p.label}
                          {assets && <span className="text-neutral-600 text-xs">{isOpen ? "▾" : "▸"}</span>}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{
                              color: p.tilt === "Overweight" ? "#4FBF8B" : p.tilt === "Underweight" ? "#D9614F" : "#8B95A1",
                              backgroundColor: p.tilt === "Overweight" ? "#4FBF8B1A" : p.tilt === "Underweight" ? "#D9614F1A" : "#8B95A11A",
                            }}
                          >
                            {p.tilt.toUpperCase()}
                          </span>
                          <Tooltip text={ALLOCATION_TILT_EXPLANATION[p.tilt as "Overweight" | "Neutral" | "Underweight"]} />
                        </span>
                      </button>
                      {isOpen && assets && (
                        <div className="pb-3 pl-1">
                          <p className="text-[11px] text-neutral-600 mb-1.5">Most prominent investable assets:</p>
                          <table className="w-full text-xs">
                            <tbody>
                              {assets.map((a) => (
                                <tr key={a.ticker}>
                                  <td className="py-0.5 font-mono text-neutral-200 w-14">{a.ticker}</td>
                                  <td className="py-0.5 text-neutral-500">{a.name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="text-[11px] text-neutral-600 mt-3">{ALLOCATION_TILT_DISCLAIMER}</p>
            </Card>

            <Card title="Holding horizon">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-xs text-neutral-500">Typical holding period</p>
                <Tooltip term="Holding Horizon" />
              </div>
              <p className="text-sm text-neutral-100 mb-4">{data.holdingHorizon.typicalPeriod}</p>
              <p className="text-xs text-neutral-500 mb-1">Position review frequency</p>
              <p className="text-sm text-neutral-100 mb-4">{data.holdingHorizon.reviewFrequency}</p>
              <p className="text-xs text-neutral-500 mb-2">Also review positions whenever:</p>
              <ul className="text-xs text-neutral-400 space-y-1 mb-4">
                {data.reviewTriggers.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
              {data.topSectorSince && Object.keys(data.topSectorSince).length > 0 && (
                <>
                  <p className="text-xs text-neutral-500 mb-1">Current Top 3 recommendations active since:</p>
                  <ul className="text-xs text-neutral-400 space-y-0.5">
                    {Object.entries(data.topSectorSince).map(([sector, since]) => (
                      <li key={sector} className="flex justify-between">
                        <span>{sector}</span>
                        <span className="font-mono text-neutral-500">{new Date(since).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          </div>

          <Card title="Historical analogues" className="mb-10">
            <p className="text-xs text-neutral-500 mb-4">
              Illustrative historical parallels for context — not a backtest or a prediction.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.historicalAnalogues.map((a) => (
                <div key={a.period} className="rounded-lg border border-neutral-800 p-4">
                  <p className="text-sm font-mono text-neutral-100 mb-1">{a.period}</p>
                  <p className="text-xs text-neutral-400 mb-3">{a.narrative}</p>
                  <p className="text-xs text-[#4FBF8B]">Best: {a.bestSectors.join(", ")}</p>
                  <p className="text-xs text-[#D9614F] mt-1">Worst: {a.worstSectors.join(", ")}</p>
                </div>
              ))}
            </div>
          </Card>

          <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-400 mb-4">All sectors, ranked</h2>
          <Card className="mb-10">
            <div className="space-y-1">
              {data.sectorScores.map((s) => (
                <div key={s.sector} className="border-b border-neutral-800 last:border-0">
                  <button
                    onClick={() => setExpanded(expanded === s.sector ? null : s.sector)}
                    className="w-full flex items-center gap-4 py-3 text-left"
                  >
                    <span className="text-sm text-neutral-200 w-44 shrink-0">{s.sector}</span>
                    <ScoreBar score={s.score} />
                  </button>
                  {expanded === s.sector && (
                    <div className="pb-4 pl-2 text-sm text-neutral-400">
                      <p className="mb-2">
                        Quadrant baseline: <span className="font-mono text-neutral-300">{s.baseline}</span>
                        {" · "}
                        Driver adjustment: <span className="font-mono text-neutral-300">{s.driverAdjustment > 0 ? `+${s.driverAdjustment}` : s.driverAdjustment}</span>
                      </p>
                      {s.driverNotes.length > 0 && (
                        <ul className="mb-2 space-y-0.5">
                          {s.driverNotes.map((n, i) => <li key={i}>• {n}</li>)}
                        </ul>
                      )}
                      <p className="text-xs text-neutral-500">Primary drivers: {s.drivers.join(", ")}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Data status" className="mb-10">
            <p className="text-xs text-neutral-500 mb-4">
              Dashboard last updated {new Date(data.generatedAt).toLocaleString()}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {REFRESH_CADENCE.map((r) => (
                <div key={r.source} className="flex items-center justify-between border-b border-neutral-800 py-1.5 last:border-0">
                  <span className="text-neutral-400">{r.source}</span>
                  <span className="text-neutral-200 font-mono text-xs">{r.frequency}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Get notified when the regime changes">
            <SubscribeForm />
          </Card>
        </>
      )}

      <p className="text-xs text-neutral-600 font-mono mt-8">
        Educational macro analysis only — not investment advice. ETF lists are illustrative examples, not recommendations to buy.
      </p>
    </PageShell>
  );
}
