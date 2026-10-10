"use client";

import { useEffect, useState } from "react";
import { Card } from "./PageShell";
import { RISK_ASSETS } from "@/lib/narrativeAssets";

type Scenario = {
  label: string;
  expectedOutcome: string;
  reasoning: string[];
  confirmConditions: string[];
  negateConditions: string[];
};
type Evaluation = { date: string; result: string; scenario: string; evidence: string };
type Narrative = {
  id: string;
  assetId: string;
  assetLabel: string;
  createdAt: string;
  keyMetric: { name: string; detail: string };
  scenarios: Scenario[];
  status: "Unresolved" | "Confirmed" | "Negated";
  confirmedScenario?: string;
  evaluations: Evaluation[];
};

const STATUS_COLOR: Record<string, string> = { Confirmed: "#4FBF8B", Negated: "#D9614F", Unresolved: "#8B95A1" };
const SCENARIO_COLOR: Record<string, string> = { Bullish: "#4FBF8B", Base: "#E0A83E", Bearish: "#D9614F" };

export function AutomatedNarrative() {
  const [assetId, setAssetId] = useState(RISK_ASSETS[0].id as string);
  const [history, setHistory] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    try {
      const res = await fetch("/api/narrative/history");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Kon historie niet laden.");
      setHistory(json.narratives);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { loadHistory(); }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/narrative/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Genereren mislukt.");
      await loadHistory();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function evaluate(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/narrative/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Evalueren mislukt.");
      await loadHistory();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const latest = history.find((n) => n.assetId === assetId);
  const older = history.filter((n) => n.id !== latest?.id);

  return (
    <div className="mb-14">
      <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-400 mb-4">Automated market narrative</h2>

      <Card className="mb-6">
        <p className="text-xs text-neutral-500 mb-3">
          1. Select a risk asset → 2. the platform generates 3 scenarios from live data and logs them →
          3. every day (and on demand) new data is compared against open narratives and each is marked
          confirmed, negated, or still unresolved. Narratives are rule-based on live platform data, not AI-written text.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-md text-sm px-3 py-2 text-neutral-100"
          >
            {RISK_ASSETS.map((a) => (
              <option key={a.id} value={a.id}>{a.label} ({a.category})</option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm px-4 py-2 text-neutral-100 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate 3 scenarios"}
          </button>
        </div>
        {error && <p className="text-xs text-[#D9614F] mt-3">{error}</p>}
      </Card>

      {latest && <NarrativeCard narrative={latest} busy={busyId === latest.id} onEvaluate={() => evaluate(latest.id)} expandedByDefault />}

      {older.length > 0 && (
        <>
          <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-500 mt-8 mb-3">Historical narrative log</h3>
          <div className="space-y-4">
            {older.map((n) => (
              <NarrativeCard key={n.id} narrative={n} busy={busyId === n.id} onEvaluate={() => evaluate(n.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NarrativeCard({
  narrative, busy, onEvaluate, expandedByDefault = false,
}: { narrative: Narrative; busy: boolean; onEvaluate: () => void; expandedByDefault?: boolean }) {
  const [open, setOpen] = useState(expandedByDefault);
  const color = STATUS_COLOR[narrative.status];

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <p className="text-sm text-neutral-100">{narrative.assetLabel}</p>
          <p className="text-[11px] text-neutral-600">Created {new Date(narrative.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded" style={{ color, backgroundColor: `${color}1A` }}>
            {narrative.status}{narrative.confirmedScenario ? ` · ${narrative.confirmedScenario}` : ""}
          </span>
          <button onClick={onEvaluate} disabled={busy} className="text-xs text-neutral-400 hover:text-neutral-200 underline disabled:opacity-50">
            {busy ? "Checking…" : "Check against new data"}
          </button>
          <button onClick={() => setOpen(!open)} className="text-xs text-neutral-500">{open ? "▾" : "▸"}</button>
        </div>
      </div>
      <p className="text-xs text-neutral-500">Key signal at creation: {narrative.keyMetric.name} — {narrative.keyMetric.detail}</p>

      {open && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {narrative.scenarios.map((s) => (
              <div key={s.label} className="rounded-lg border border-neutral-800 p-3">
                <p className="text-xs font-mono uppercase mb-1" style={{ color: SCENARIO_COLOR[s.label] }}>{s.label}</p>
                <p className="text-sm text-neutral-200 mb-2">{s.expectedOutcome}</p>
                <ul className="text-xs text-neutral-400 space-y-1 mb-2">
                  {s.reasoning.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
                <p className="text-[11px] text-[#4FBF8B]">Confirms if: {s.confirmConditions.join(" ")}</p>
                <p className="text-[11px] text-[#D9614F] mt-1">Negated if: {s.negateConditions.join(" ")}</p>
              </div>
            ))}
          </div>

          <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mt-5 mb-2">Evaluation history</p>
          {narrative.evaluations.length === 0 ? (
            <p className="text-xs text-neutral-600">Not yet evaluated — the daily check or the button above will add the first entry.</p>
          ) : (
            <ul className="space-y-1.5">
              {narrative.evaluations.map((e, i) => (
                <li key={i} className="text-xs flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-neutral-800 last:border-0 pb-1.5">
                  <span className="text-neutral-400">
                    <span style={{ color: STATUS_COLOR[e.result] ?? "#8B95A1" }}>{e.result}</span> ({e.scenario}) — {e.evidence}
                  </span>
                  <span className="text-neutral-600 font-mono">{new Date(e.date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
