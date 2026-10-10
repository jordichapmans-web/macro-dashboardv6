import { Quadrant } from "./macroEngine";

export const HOLDING_HORIZON: Record<Quadrant, { typicalPeriod: string; reviewFrequency: string }> = {
  Recovery: { typicalPeriod: "3–9 months, or until the regime changes", reviewFrequency: "Monthly" },
  Overheat: { typicalPeriod: "3–9 months, or until the regime changes", reviewFrequency: "Monthly" },
  Stagflation: { typicalPeriod: "Until growth or inflation trends shift materially", reviewFrequency: "Monthly" },
  Reflation: { typicalPeriod: "3–9 months, or until the regime changes", reviewFrequency: "Monthly" },
};

export const REVIEW_TRIGGERS = [
  "The macro regime changes",
  "Liquidity deteriorates materially",
  "Inflation trends shift direction",
  "Growth weakens significantly",
];
