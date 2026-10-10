import { Quadrant } from "./macroEngine";

/**
 * SECTOR ROTATION MODEL
 * -----------------------
 * A second, complementary lens to the Investment Clock. Where the Clock
 * classifies growth+inflation into 4 quadrants, this model classifies the
 * market into a simpler Risk-On / Risk-Off regime and lists which sectors
 * have historically led in each — the same logic stock market sector-rotation
 * models (e.g. the classic RRG-based rotation model) use.
 */

export type RiskRegime = "Risk-On" | "Risk-Off";

export const EARLY_CYCLE_SECTORS = [
  { name: "Technology", note: "Leads early recoveries and bull markets as risk appetite returns." },
  { name: "Communication Services", note: "Benefits from renewed ad spend and consumer confidence." },
  { name: "Consumer Discretionary", note: "Nike, restaurants, travel — spending investors cut first in downturns, first to recover." },
  { name: "Industrials", note: "Capex and production ramp up as growth accelerates." },
];

export const LATE_CYCLE_DEFENSIVE_SECTORS = [
  { name: "Consumer Staples", note: "Groceries and household goods — demand holds up regardless of the cycle." },
  { name: "Health Care", note: "Evergreen demand in both bull and bear markets." },
  { name: "Utilities", note: "Stable, regulated cash flows; bought for defense, sensitive to rate policy." },
  { name: "Real Estate", note: "Heavily driven by financing costs — most real estate is bought on credit, so central bank rate decisions hit this sector hard." },
  { name: "Materials", note: "More defensive than cyclical industrials, but still commodity-price sensitive." },
  { name: "Energy", note: "Driven primarily by oil prices rather than the broader cycle." },
];

// Financials sit apart from both lists deliberately — per the notes, they are
// usually solid but are the sector that suffers most specifically during a
// financial-system crisis, which is a distinct risk from a normal slowdown.
export const FINANCIALS_NOTE =
  "Financials are usually resilient in ordinary slowdowns, but are the sector most exposed if the stress is a financial-system crisis specifically (credit, liquidity, bank balance sheets) rather than a normal cyclical downturn.";

/**
 * Maps the Investment Clock quadrant to a simple risk regime for this model.
 * Recovery and Overheat = growth is rising = Risk-On.
 * Reflation and Stagflation = growth is falling = Risk-Off.
 */
export function quadrantToRiskRegime(quadrant: Quadrant): RiskRegime {
  return quadrant === "Recovery" || quadrant === "Overheat" ? "Risk-On" : "Risk-Off";
}

export function regimeExplanation(regime: RiskRegime): string {
  return regime === "Risk-On"
    ? "Growth is currently rising, which historically favors the early-cycle, higher-beta sectors below."
    : "Growth is currently falling, which historically favors the defensive, late-cycle sectors below.";
}
