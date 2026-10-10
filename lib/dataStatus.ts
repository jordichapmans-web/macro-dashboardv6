export const REFRESH_CADENCE: { source: string; frequency: string }[] = [
  { source: "Liquidity / Fed Funds", frequency: "Monthly (daily effective rate)" },
  { source: "Inflation (CPI)", frequency: "Monthly" },
  { source: "Growth (Industrial Production)", frequency: "Monthly" },
  { source: "Employment (Unemployment Rate)", frequency: "Monthly" },
  { source: "Yield Curve / 10Y Yield", frequency: "Daily" },
  { source: "Real Yield (5Y TIPS)", frequency: "Daily" },
  { source: "Dollar Index", frequency: "Daily" },
  { source: "Oil (WTI)", frequency: "Daily" },
  { source: "Mortgage Rate", frequency: "Weekly" },
  { source: "Credit Spread (Baa-10Y)", frequency: "Daily" },
  { source: "Sector ETF prices (tactical readiness)", frequency: "Daily" },
];
