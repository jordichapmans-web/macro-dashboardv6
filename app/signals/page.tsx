"use client";

import { useEffect, useState } from "react";
import { PageShell, Card } from "@/components/PageShell";
import { useMacroData } from "@/lib/useMacroData";

type CurrencyRow = {
  code: string;
  shortRateLabel: string;
  shortRate: number | null;
  shortRateTrend: string | null;
  longBondYield: number | null;
  longBondTrend: string | null;
  strengthScore: number | null;
  direction: string;
};
type FxPairRow = {
  pair: string;
  divergence: number | null;
  direction: string;
  volatilityPotential: string;
  explanation: string;
};
type FxResponse = { currencies: CurrencyRow[]; pairs: FxPairRow[]; error?: string };

function directionColor(direction: string): string {
  if (direction.includes("Bullish") || direction === "Strengthening") return "#4FBF8B";
  if (direction.includes("Bearish") || direction === "Weakening") return "#D9614F";
  return "#8B95A1";
}

function useFxData() {
  const [data, setData] = useState<FxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/fx")
      .then((r) => r.json())
      .then((json) => (json.error ? setError(json.error) : setData(json)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading, error };
}

export default function SignalsPage() {
  const { data, loading, error } = useMacroData();
  const realYield = data?.rawInputs.realYield5Y ?? null;
  const dollarTrend = data?.rawInputs.dollarIndexTrend ?? null;
  const fx = useFxData();

  return (
    <PageShell
      title="Cross-Asset Signals"
      subtitle="Gold, real yields, and the forex carry trade — the relationships that connect bond markets to everything else."
    >
      {loading && <p className="text-neutral-400 font-mono text-sm">Loading live data…</p>}
      {error && <p className="text-red-400 font-mono text-sm">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card title="Real yields — the main driver of gold">
          {realYield != null && (
            <p className="text-3xl font-mono font-semibold text-neutral-100 mb-3">
              {realYield.toFixed(2)}%
              <span className="text-xs text-neutral-500 font-sans ml-2">5Y real yield (TIPS)</span>
            </p>
          )}
          <p className="text-sm text-neutral-300 leading-relaxed">
            Gold pays no yield, so its opportunity cost is set by the <em>real</em> (inflation-adjusted) return
            available elsewhere. When real yields rise, safe government debt competes hard with gold and gold
            tends to suffer. When real yields fall — or turn negative — gold's lack of yield stops being a
            disadvantage, and it tends to perform well. This is why gold is best read alongside real yields,
            not the nominal bond yield alone.
          </p>
          <p className="text-xs text-neutral-500 mt-4">
            Note: FRED discontinued its LBMA gold price series in 2022, so live spot gold isn't pulled into
            this build yet — this reads the real-yield driver directly. A market-data provider (e.g. a
            precious metals or commodities API) would be the next piece to wire in for the price itself.
          </p>
        </Card>

        <Card title="Dollar Index trend">
          {dollarTrend && (
            <p className="text-2xl font-semibold text-neutral-100 mb-3">{dollarTrend}</p>
          )}
          <p className="text-sm text-neutral-300 leading-relaxed">
            The trade-weighted Dollar Index reflects the U.S. currency's value against a basket of trading
            partners. It matters for macro allocation because a strong dollar tightens global financial
            conditions (dollar-denominated debt gets more expensive to service everywhere outside the U.S.),
            while a weak dollar tends to loosen them.
          </p>
        </Card>
      </div>

      <Card title="The carry trade — how interest rate differentials drive forex">
        <p className="text-sm text-neutral-300 leading-relaxed mb-4">
          The core driver of any currency pair is the spread between the two countries' interest rates and
          bond yields — capital moves toward whichever currency offers the better risk-adjusted return.
        </p>

        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="rounded-lg border border-neutral-800 p-4">
            <p className="text-xs font-mono uppercase text-neutral-500 mb-2">Example: EUR</p>
            <div className="text-sm text-neutral-300 space-y-1">
              <div className="flex justify-between"><span>Interest rate</span><span className="font-mono">1.0%</span></div>
              <div className="flex justify-between"><span>Bond yield</span><span className="font-mono">1.5%</span></div>
            </div>
          </div>
          <div className="rounded-lg border border-neutral-800 p-4">
            <p className="text-xs font-mono uppercase text-neutral-500 mb-2">Example: USD</p>
            <div className="text-sm text-neutral-300 space-y-1">
              <div className="flex justify-between"><span>Interest rate</span><span className="font-mono">5.0%</span></div>
              <div className="flex justify-between"><span>Bond yield</span><span className="font-mono">5.2%</span></div>
            </div>
          </div>
        </div>

        <p className="text-sm text-neutral-300 leading-relaxed">
          In this example, capital has a clear incentive to park in USD for the better yearly return. The
          "carry trade" takes this further: borrowing cheaply in a low-rate currency (the Japanese yen at
          near-0% rates being the best-known recent case) and re-lending that money into a higher-yielding
          currency's government bonds — pocketing the spread.
        </p>
      </Card>

      <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-400 mb-4 mt-10">
        Major currency rates — EUR, USD, GBP, JPY, CAD, NZD, CHF, AUD
      </h2>

      {fx.loading && <p className="text-neutral-400 font-mono text-sm mb-6">Loading live rate data…</p>}
      {fx.error && <p className="text-red-400 font-mono text-sm mb-6">{fx.error}</p>}

      {fx.data && (
        <>
          <Card className="mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-xs text-neutral-500 border-b border-neutral-800">
                    <th className="py-2 pr-4">Currency</th>
                    <th className="py-2 pr-4">Policy / short rate</th>
                    <th className="py-2 pr-4">Trend</th>
                    <th className="py-2 pr-4">10Y bond yield</th>
                    <th className="py-2 pr-4">Trend</th>
                    <th className="py-2 pr-4">Macro signal</th>
                  </tr>
                </thead>
                <tbody>
                  {fx.data.currencies.map((c) => (
                    <tr key={c.code} className="border-b border-neutral-800 last:border-0">
                      <td className="py-2 pr-4 font-mono text-neutral-100">{c.code}</td>
                      <td className="py-2 pr-4 text-neutral-300">
                        {c.shortRate != null ? `${c.shortRate.toFixed(2)}%` : "N/A"}
                        <span className="text-neutral-600 text-xs ml-1">({c.shortRateLabel})</span>
                      </td>
                      <td className="py-2 pr-4 text-neutral-400">{c.shortRateTrend ?? "—"}</td>
                      <td className="py-2 pr-4 text-neutral-300">{c.longBondYield != null ? `${c.longBondYield.toFixed(2)}%` : "N/A"}</td>
                      <td className="py-2 pr-4 text-neutral-400">{c.longBondTrend ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: directionColor(c.direction), backgroundColor: `${directionColor(c.direction)}1A` }}>
                          {c.direction}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-600 mt-4">
              Policy/short rates use each economy's own standard reference rate (e.g. Fed Funds for USD, the
              ECB Deposit Facility Rate for EUR). 10-year yields are each country's government bond, sourced
              from FRED's OECD-mirrored series.
            </p>
          </Card>

          <Card title="Currency strength ranking" className="mb-8">
            <p className="text-xs text-neutral-500 mb-4">
              Ranked by a strength score: how far each currency's short rate sits above or below the
              8-currency average, adjusted slightly for whether rates and yields are currently rising or
              falling — the same carry-trade logic explained above, just applied across all eight at once.
            </p>
            <div className="space-y-2">
              {[...fx.data.currencies]
                .sort((a, b) => (b.strengthScore ?? -999) - (a.strengthScore ?? -999))
                .map((c) => (
                  <div key={c.code} className="flex items-center justify-between text-sm border-b border-neutral-800 last:border-0 py-2">
                    <span className="font-mono text-neutral-100 w-12">{c.code}</span>
                    <span className="text-neutral-400">{c.direction}</span>
                    <span className="font-mono text-neutral-300">{c.strengthScore != null ? (c.strengthScore >= 0 ? `+${c.strengthScore}` : c.strengthScore) : "N/A"}</span>
                  </div>
                ))}
            </div>
          </Card>

          <Card title="FX pair ranking — strongest macro divergence first">
            <p className="text-xs text-neutral-500 mb-4">
              Pairs where the two currencies' macro directions diverge most sharply — the platform's read on
              where a directional move is best macro-supported, ranked from strongest setup to weakest.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs text-neutral-500 border-b border-neutral-800">
                    <th className="py-2 pr-4">Pair</th>
                    <th className="py-2 pr-4">Direction</th>
                    <th className="py-2 pr-4">Volatility potential</th>
                    <th className="py-2 pr-4">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {fx.data.pairs.slice(0, 12).map((p) => (
                    <tr key={p.pair} className="border-b border-neutral-800 last:border-0">
                      <td className="py-2 pr-4 font-mono text-neutral-100">{p.pair}</td>
                      <td className="py-2 pr-4">
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: directionColor(p.direction), backgroundColor: `${directionColor(p.direction)}1A` }}>
                          {p.direction}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-neutral-400">{p.volatilityPotential}</td>
                      <td className="py-2 pr-4 text-xs text-neutral-500">{p.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-600 mt-4">
              Divergence and volatility-potential labels are derived directly from the strength scores above —
              not a separate prediction model. This identifies macro-supported setups, not entry timing.
            </p>
          </Card>
        </>
      )}
    </PageShell>
  );
}
