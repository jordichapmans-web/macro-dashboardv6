import { Quadrant } from "./macroEngine";

export type PositioningLine = { label: string; tilt: "Overweight" | "Neutral" | "Underweight" };

export const SUGGESTED_POSITIONING: Record<Quadrant, PositioningLine[]> = {
  Recovery: [
    { label: "Stocks (broad)", tilt: "Overweight" },
    { label: "Technology & Cyclicals", tilt: "Overweight" },
    { label: "Financials", tilt: "Neutral" },
    { label: "Long-duration Bonds", tilt: "Underweight" },
    { label: "Cash", tilt: "Underweight" },
  ],
  Overheat: [
    { label: "Commodities", tilt: "Overweight" },
    { label: "Energy & Materials", tilt: "Overweight" },
    { label: "Financials", tilt: "Neutral" },
    { label: "Long-duration Bonds", tilt: "Underweight" },
    { label: "Growth Technology", tilt: "Underweight" },
  ],
  Stagflation: [
    { label: "Cash", tilt: "Overweight" },
    { label: "Consumer Staples & Healthcare", tilt: "Overweight" },
    { label: "Gold / inflation hedges", tilt: "Overweight" },
    { label: "Consumer Discretionary", tilt: "Underweight" },
    { label: "Financials", tilt: "Underweight" },
  ],
  Reflation: [
    { label: "Government Bonds", tilt: "Overweight" },
    { label: "Utilities & Defensive Equities", tilt: "Overweight" },
    { label: "Commodities", tilt: "Underweight" },
    { label: "Cyclicals", tilt: "Underweight" },
    { label: "Cash", tilt: "Neutral" },
  ],
};
