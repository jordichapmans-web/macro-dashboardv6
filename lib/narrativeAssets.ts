export type RiskAssetId =
  | "sp500" | "gold" | "oil" | "dxy" | "eurusd"
  | "technology_sector" | "energy_sector" | "long_duration_bonds";

export const RISK_ASSETS: { id: RiskAssetId; label: string; category: string }[] = [
  { id: "sp500", label: "S&P 500 (Equities)", category: "Index" },
  { id: "gold", label: "Gold", category: "Commodity" },
  { id: "oil", label: "Oil (WTI)", category: "Commodity" },
  { id: "dxy", label: "US Dollar Index", category: "FX" },
  { id: "eurusd", label: "EUR/USD", category: "FX" },
  { id: "technology_sector", label: "Technology Sector", category: "Equity Sector" },
  { id: "energy_sector", label: "Energy Sector", category: "Equity Sector" },
  { id: "long_duration_bonds", label: "Long-Duration Bonds", category: "Fixed Income" },
];
