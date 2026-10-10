import { Quadrant } from "./macroEngine";

export type Analogue = {
  period: string;
  narrative: string;
  bestSectors: string[];
  worstSectors: string[];
};

/**
 * These are illustrative historical parallels, not the output of a backtest
 * engine — there's no live computation behind the specific periods listed.
 * A real historical-analogue feature would need a proper price-history
 * database spanning decades; this is a placeholder that's honest about
 * being a placeholder, per the "no black box" principle used everywhere
 * else in this platform.
 */
export const HISTORICAL_ANALOGUES: Record<Quadrant, Analogue[]> = {
  Recovery: [
    {
      period: "2009–2010",
      narrative: "Post-financial-crisis recovery — growth troughed and re-accelerated while inflation stayed contained.",
      bestSectors: ["Technology", "Consumer Discretionary", "Industrials"],
      worstSectors: ["Utilities", "Consumer Staples"],
    },
    {
      period: "2020–2021 (early)",
      narrative: "Sharp reopening recovery following the pandemic shock.",
      bestSectors: ["Consumer Discretionary", "Technology"],
      worstSectors: ["Utilities", "Energy"],
    },
  ],
  Overheat: [
    {
      period: "2021–2022",
      narrative: "Growth remained strong while inflation accelerated sharply.",
      bestSectors: ["Energy", "Materials"],
      worstSectors: ["Long-duration Technology", "Growth stocks"],
    },
  ],
  Stagflation: [
    {
      period: "2022 (mid)",
      narrative: "Growth began slowing while inflation remained elevated.",
      bestSectors: ["Consumer Staples", "Healthcare", "Energy"],
      worstSectors: ["Consumer Discretionary", "Real Estate"],
    },
  ],
  Reflation: [
    {
      period: "2019",
      narrative: "Growth and inflation both soft, central banks cutting rates.",
      bestSectors: ["Utilities", "Real Estate", "Technology"],
      worstSectors: ["Energy", "Financials"],
    },
  ],
};
