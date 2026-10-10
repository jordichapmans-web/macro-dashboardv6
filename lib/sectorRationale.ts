import { SectorName } from "./etfDatabase";

export const SECTOR_RATIONALE: Record<SectorName, string> = {
  Energy: "Energy companies' revenues scale directly with commodity prices, so they capture upside when inflation and demand both accelerate.",
  Materials: "Materials producers benefit from the same commodity and industrial-demand dynamics as Energy, with added sensitivity to global manufacturing activity.",
  "Real Estate": "Real estate is financed heavily through debt, so it benefits when rates are low or falling and struggles when rates rise.",
  Financials: "Bank profitability depends on the spread between short and long rates — financials tend to benefit when the yield curve is steep and credit conditions are healthy.",
  Technology: "Tech valuations lean heavily on future earnings, making the sector sensitive to real yields — it tends to benefit when yields are low or falling.",
  "Consumer Discretionary": "Discretionary spending (travel, retail, autos) is the first to expand when employment and confidence improve, and the first to contract when they don't.",
  Healthcare: "Demand for healthcare holds up regardless of the economic cycle, making it a common destination for defensive positioning.",
  Utilities: "Utilities offer bond-like, regulated cash flows, so they're typically favored when growth is weak and rates are falling.",
  Industrials: "Industrial activity picks up early in a recovery as businesses restock and re-invest in capacity.",
  "Communication Services": "This sector leans on advertising and consumer spending, giving it a cyclical tilt similar to Discretionary and Technology.",
  "Consumer Staples": "Staples (groceries, household goods) see stable demand in downturns, making them a classic defensive rotation target.",
};
