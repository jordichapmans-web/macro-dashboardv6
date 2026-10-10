export type AssetRef = { ticker: string; name: string };

// Keyed by the exact label text used in lib/suggestedPositioning.ts. Labels
// repeat across quadrants (e.g. "Financials" appears in several), so one
// shared lookup covers every quadrant's positioning list.
export const POSITIONING_ASSETS: Record<string, AssetRef[]> = {
  "Stocks (broad)": [
    { ticker: "SPY", name: "SPDR S&P 500 ETF Trust" },
    { ticker: "VTI", name: "Vanguard Total Stock Market ETF" },
    { ticker: "VOO", name: "Vanguard S&P 500 ETF" },
  ],
  "Technology & Cyclicals": [
    { ticker: "XLK", name: "Technology Select Sector SPDR" },
    { ticker: "XLY", name: "Consumer Discretionary Select Sector SPDR" },
    { ticker: "XLI", name: "Industrial Select Sector SPDR" },
  ],
  Financials: [
    { ticker: "XLF", name: "Financial Select Sector SPDR" },
    { ticker: "VFH", name: "Vanguard Financials ETF" },
    { ticker: "KBE", name: "SPDR S&P Bank ETF" },
  ],
  "Long-duration Bonds": [
    { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF" },
    { ticker: "EDV", name: "Vanguard Extended Duration Treasury ETF" },
    { ticker: "ZROZ", name: "PIMCO 25+ Year Zero Coupon US Treasury ETF" },
  ],
  Cash: [
    { ticker: "BIL", name: "SPDR Bloomberg 1-3 Month T-Bill ETF" },
    { ticker: "SHV", name: "iShares Short Treasury Bond ETF" },
    { ticker: "SGOV", name: "iShares 0-3 Month Treasury Bond ETF" },
  ],
  Commodities: [
    { ticker: "DBC", name: "Invesco DB Commodity Index Tracking Fund" },
    { ticker: "GSG", name: "iShares S&P GSCI Commodity-Indexed Trust" },
    { ticker: "PDBC", name: "Invesco Optimum Yield Diversified Commodity ETF" },
  ],
  "Energy & Materials": [
    { ticker: "XLE", name: "Energy Select Sector SPDR" },
    { ticker: "XLB", name: "Materials Select Sector SPDR" },
    { ticker: "VDE", name: "Vanguard Energy ETF" },
  ],
  "Consumer Staples & Healthcare": [
    { ticker: "XLP", name: "Consumer Staples Select Sector SPDR" },
    { ticker: "XLV", name: "Health Care Select Sector SPDR" },
    { ticker: "VDC", name: "Vanguard Consumer Staples ETF" },
  ],
  "Gold / inflation hedges": [
    { ticker: "GLD", name: "SPDR Gold Shares" },
    { ticker: "IAU", name: "iShares Gold Trust" },
    { ticker: "SLV", name: "iShares Silver Trust" },
  ],
  "Consumer Discretionary": [
    { ticker: "XLY", name: "Consumer Discretionary Select Sector SPDR" },
    { ticker: "VCR", name: "Vanguard Consumer Discretionary ETF" },
    { ticker: "IYC", name: "iShares U.S. Consumer Discretionary ETF" },
  ],
  "Government Bonds": [
    { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF" },
    { ticker: "IEF", name: "iShares 7-10 Year Treasury Bond ETF" },
    { ticker: "GOVT", name: "iShares U.S. Treasury Bond ETF" },
  ],
  "Utilities & Defensive Equities": [
    { ticker: "XLU", name: "Utilities Select Sector SPDR" },
    { ticker: "XLP", name: "Consumer Staples Select Sector SPDR" },
    { ticker: "XLV", name: "Health Care Select Sector SPDR" },
  ],
  Cyclicals: [
    { ticker: "XLI", name: "Industrial Select Sector SPDR" },
    { ticker: "XLY", name: "Consumer Discretionary Select Sector SPDR" },
    { ticker: "XLF", name: "Financial Select Sector SPDR" },
  ],
};
