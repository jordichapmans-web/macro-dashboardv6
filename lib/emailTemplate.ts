import { RegimeLogEntry } from "./regimeLog";
import { SectorScore } from "./sectorScoringEngine";

const PREFERRED_ASSET: Record<string, string> = {
  Recovery: "Stocks",
  Overheat: "Commodities",
  Stagflation: "Cash",
  Reflation: "Bonds",
};

export function generateDraftEmail(entry: RegimeLogEntry, topSectors: SectorScore[]) {
  const subject = `Macro Regime Update — The Economy Has Entered ${entry.to}`;

  const sectorList = topSectors.map((s) => `<li>${s.sector}</li>`).join("");
  const reasonList = entry.reason.slice(0, 4).map((r) => `<li>${r}</li>`).join("");

  const body = `
<p>Hello,</p>
<p>The Aion dashboard has detected a change in the macroeconomic regime.</p>
<p><strong>Previous Regime:</strong> ${entry.from ?? "n/a"}<br/>
<strong>Current Regime:</strong> ${entry.to}</p>
<p>${reasonList ? `<ul>${reasonList}</ul>` : ""}</p>
<p>Historically, this environment has favored ${PREFERRED_ASSET[entry.to] ?? "a different asset mix"}, particularly:</p>
<ul>${sectorList}</ul>
<p>Visit the dashboard to review the updated macro analysis, portfolio positioning, sector recommendations, and ETF ideas.</p>
<p>Thank you for subscribing.<br/>The Aion Team</p>
<p style="font-size:12px;color:#888;">This is a strategic macro signal, not personalized investment advice or an immediate buy signal.</p>
`.trim();

  return { subject, body };
}
