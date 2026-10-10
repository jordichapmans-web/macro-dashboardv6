"use client";

import { useState } from "react";
import { PageShell, Card } from "@/components/PageShell";
import { AutomatedNarrative } from "@/components/AutomatedNarrative";

type Stance = "Easing" | "Neutral" | "Tightening";
type Direction = "Rising" | "Stable" | "Falling";

type Scenario = {
  id: string;
  label: string;
  monetary: Stance;
  fiscal: "Expansionary" | "Neutral" | "Contractionary";
  unemployment: Direction;
  inflation: Direction;
  softData: "Improving" | "Mixed" | "Deteriorating";
};

const BLANK_SCENARIO = (id: string, label: string): Scenario => ({
  id,
  label,
  monetary: "Neutral",
  fiscal: "Neutral",
  unemployment: "Stable",
  inflation: "Stable",
  softData: "Mixed",
});

function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="bg-neutral-800 border border-neutral-700 rounded-md text-sm px-2 py-1 text-neutral-100"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function ScenarioEditor({
  scenario,
  selected,
  onSelect,
  onChange,
}: {
  scenario: Scenario;
  selected: boolean;
  onSelect: () => void;
  onChange: (s: Scenario) => void;
}) {
  return (
    <div
      className={`rounded-xl border p-5 cursor-pointer transition-colors ${
        selected ? "border-neutral-400 bg-neutral-900" : "border-neutral-800 bg-neutral-900/40"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-4">
        <input
          value={scenario.label}
          onChange={(e) => onChange({ ...scenario, label: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent text-sm font-medium text-neutral-100 border-b border-transparent hover:border-neutral-700 focus:border-neutral-500 outline-none"
        />
        {selected && <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full bg-neutral-700 text-neutral-200">Most likely</span>}
      </div>

      <div className="space-y-2.5 text-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><span className="text-neutral-400">Monetary policy</span><Select value={scenario.monetary} options={["Easing", "Neutral", "Tightening"]} onChange={(v) => onChange({ ...scenario, monetary: v })} /></div>
        <div className="flex items-center justify-between"><span className="text-neutral-400">Fiscal policy</span><Select value={scenario.fiscal} options={["Expansionary", "Neutral", "Contractionary"]} onChange={(v) => onChange({ ...scenario, fiscal: v })} /></div>
        <div className="flex items-center justify-between"><span className="text-neutral-400">Unemployment</span><Select value={scenario.unemployment} options={["Rising", "Stable", "Falling"]} onChange={(v) => onChange({ ...scenario, unemployment: v })} /></div>
        <div className="flex items-center justify-between"><span className="text-neutral-400">Inflation</span><Select value={scenario.inflation} options={["Rising", "Stable", "Falling"]} onChange={(v) => onChange({ ...scenario, inflation: v })} /></div>
        <div className="flex items-center justify-between"><span className="text-neutral-400">Soft data</span><Select value={scenario.softData} options={["Improving", "Mixed", "Deteriorating"]} onChange={(v) => onChange({ ...scenario, softData: v })} /></div>
      </div>
    </div>
  );
}

type Classification = "Confirms" | "Neutral" | "Negates";

export default function NarrativePage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    BLANK_SCENARIO("a", "Scenario A"),
    BLANK_SCENARIO("b", "Scenario B"),
    BLANK_SCENARIO("c", "Scenario C"),
  ]);
  const [selectedId, setSelectedId] = useState("a");

  const [pricedIn, setPricedIn] = useState({ dxy: "", sp500: "", bonds: "", gold: "" });

  const [dataPoint, setDataPoint] = useState("");
  const [classification, setClassification] = useState<Classification>("Neutral");
  const [log, setLog] = useState<{ point: string; classification: Classification }[]>([]);

  const selected = scenarios.find((s) => s.id === selectedId)!;

  const guidance: Record<Classification, string> = {
    Confirms: "The narrative is intact. Normal continuation is likely — if already at all-time highs, watch for a 'sell the news' reaction even on a confirming print.",
    Neutral: "Prices usually don't move much on data that's neutral to the prevailing narrative.",
    Negates: "This is the case that matters most — a radical negation can trigger a sharp move and a possible trend inversion.",
  };

  function addLogEntry() {
    if (!dataPoint.trim()) return;
    setLog([{ point: dataPoint.trim(), classification }, ...log]);
    setDataPoint("");
  }

  return (
    <PageShell
      title="Market Narrative"
      subtitle="Build competing macro scenarios, decide which is most likely, then track whether new data confirms, is neutral to, or negates it."
    >
      <AutomatedNarrative />

      <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-400 mb-2">Manual worksheet</h2>
      <p className="text-xs text-neutral-600 mb-6">Your own scenario builder and data-point log — unchanged.</p>

      <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-400 mb-4">1. Build 3 scenarios</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {scenarios.map((s) => (
          <ScenarioEditor
            key={s.id}
            scenario={s}
            selected={s.id === selectedId}
            onSelect={() => setSelectedId(s.id)}
            onChange={(updated) => setScenarios(scenarios.map((sc) => (sc.id === s.id ? updated : sc)))}
          />
        ))}
      </div>

      <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-400 mb-4">2. What is the market currently pricing in?</h2>
      <Card className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(["dxy", "sp500", "bonds", "gold"] as const).map((k) => (
            <div key={k}>
              <label className="text-xs text-neutral-500 uppercase font-mono">{k === "sp500" ? "S&P 500" : k.toUpperCase()}</label>
              <input
                value={pricedIn[k]}
                onChange={(e) => setPricedIn({ ...pricedIn, [k]: e.target.value })}
                placeholder="expected move, 3–9mo"
                className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-md text-sm px-2 py-1.5 text-neutral-100 placeholder:text-neutral-600"
              />
            </div>
          ))}
        </div>
      </Card>

      <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-400 mb-4">
        3. Classify new data against <span className="text-neutral-200">{selected.label}</span>
      </h2>
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input
            value={dataPoint}
            onChange={(e) => setDataPoint(e.target.value)}
            placeholder="e.g. CPI printed 0.2% below expectations"
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md text-sm px-3 py-2 text-neutral-100 placeholder:text-neutral-600"
          />
          <Select value={classification} options={["Confirms", "Neutral", "Negates"]} onChange={setClassification} />
          <button
            onClick={addLogEntry}
            className="rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm px-4 py-2 text-neutral-100 transition-colors"
          >
            Log it
          </button>
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed">{guidance[classification]}</p>
      </Card>

      {log.length > 0 && (
        <Card title="Narrative log">
          <ul className="space-y-2">
            {log.map((entry, i) => (
              <li key={i} className="flex items-center justify-between text-sm border-b border-neutral-800 last:border-0 py-2">
                <span className="text-neutral-300">{entry.point}</span>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                    entry.classification === "Confirms"
                      ? "text-[#4FBF8B] bg-[#4FBF8B]/10"
                      : entry.classification === "Negates"
                      ? "text-[#D9614F] bg-[#D9614F]/10"
                      : "text-neutral-400 bg-neutral-800"
                  }`}
                >
                  {entry.classification}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-xs text-neutral-600 font-mono mt-8">
        This worksheet holds state in your browser session only for now — nothing is saved yet. Persisting
        this history and connecting the AI layer to auto-classify incoming releases is a natural v2 addition.
      </p>
    </PageShell>
  );
}
