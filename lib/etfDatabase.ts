export type SectorName =
  | "Technology"
  | "Healthcare"
  | "Financials"
  | "Consumer Discretionary"
  | "Consumer Staples"
  | "Industrials"
  | "Communication Services"
  | "Energy"
  | "Materials"
  | "Utilities"
  | "Real Estate";

export type EtfEntry = { ticker: string; name: string };

export const ETF_DATABASE: Record<SectorName, EtfEntry[]> = {
  Technology: [
    { ticker: "XLK", name: "Technology Select Sector SPDR" },
    { ticker: "VGT", name: "Vanguard Information Technology ETF" },
    { ticker: "IYW", name: "iShares U.S. Technology ETF" },
  ],
  Healthcare: [
    { ticker: "XLV", name: "Health Care Select Sector SPDR" },
    { ticker: "VHT", name: "Vanguard Health Care ETF" },
    { ticker: "IYH", name: "iShares U.S. Healthcare ETF" },
  ],
  Financials: [
    { ticker: "XLF", name: "Financial Select Sector SPDR" },
    { ticker: "VFH", name: "Vanguard Financials ETF" },
    { ticker: "IYG", name: "iShares U.S. Financial Services ETF" },
  ],
  "Consumer Discretionary": [
    { ticker: "XLY", name: "Consumer Discretionary Select Sector SPDR" },
    { ticker: "VCR", name: "Vanguard Consumer Discretionary ETF" },
    { ticker: "IYC", name: "iShares U.S. Consumer Discretionary ETF" },
  ],
  "Consumer Staples": [
    { ticker: "XLP", name: "Consumer Staples Select Sector SPDR" },
    { ticker: "VDC", name: "Vanguard Consumer Staples ETF" },
    { ticker: "KXI", name: "iShares Global Consumer Staples ETF" },
  ],
  Industrials: [
    { ticker: "XLI", name: "Industrial Select Sector SPDR" },
    { ticker: "VIS", name: "Vanguard Industrials ETF" },
    { ticker: "IYJ", name: "iShares U.S. Industrials ETF" },
  ],
  "Communication Services": [
    { ticker: "XLC", name: "Communication Services Select Sector SPDR" },
    { ticker: "VOX", name: "Vanguard Communication Services ETF" },
    { ticker: "IXP", name: "iShares Global Comm Services ETF" },
  ],
  Energy: [
    { ticker: "XLE", name: "Energy Select Sector SPDR" },
    { ticker: "VDE", name: "Vanguard Energy ETF" },
    { ticker: "IXC", name: "iShares Global Energy ETF" },
  ],
  Materials: [
    { ticker: "XLB", name: "Materials Select Sector SPDR" },
    { ticker: "VAW", name: "Vanguard Materials ETF" },
    { ticker: "MXI", name: "iShares Global Materials ETF" },
  ],
  Utilities: [
    { ticker: "XLU", name: "Utilities Select Sector SPDR" },
    { ticker: "VPU", name: "Vanguard Utilities ETF" },
    { ticker: "IDU", name: "iShares U.S. Utilities ETF" },
  ],
  "Real Estate": [
    { ticker: "XLRE", name: "Real Estate Select Sector SPDR" },
    { ticker: "VNQ", name: "Vanguard Real Estate ETF" },
    { ticker: "IYR", name: "iShares U.S. Real Estate ETF" },
  ],
};

export const ALL_SECTORS = Object.keys(ETF_DATABASE) as SectorName[];
