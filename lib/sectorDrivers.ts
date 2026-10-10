import { SectorName } from "./etfDatabase";

export const SECTOR_DRIVERS: Record<SectorName, string[]> = {
  Energy: ["Oil prices", "Natural gas prices", "Global demand", "OPEC production", "Geopolitical tensions"],
  Materials: ["Copper & industrial metals", "Industrial demand", "China PMI", "Construction activity"],
  "Real Estate": ["Mortgage rates", "10-Year Treasury yield", "Fed policy", "Housing demand", "Construction permits"],
  Financials: ["Interest rates", "Yield curve slope", "Loan demand", "Credit spreads", "Fed policy"],
  Technology: ["Real yields", "Liquidity conditions", "AI investment", "Corporate earnings", "Capex spending"],
  "Consumer Discretionary": ["Employment", "Consumer confidence", "Retail sales", "Disposable income"],
  Healthcare: ["Defensive flows", "Aging population", "Government spending"],
  Utilities: ["Interest rates", "Electricity demand", "Natural gas prices"],
  Industrials: ["PMIs", "Manufacturing activity", "Infrastructure spending"],
  "Communication Services": ["Advertising spending", "Consumer demand", "AI infrastructure spending"],
  "Consumer Staples": ["Inflation", "Consumer spending resilience", "Defensive rotation flows"],
};
