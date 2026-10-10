import { MacroResult } from "./macroEngine";

export type ConfidenceCheck = { label: string; passed: boolean };

export function computeConfidence(result: MacroResult): { score: number; checks: ConfidenceCheck[] } {
  const { quadrant, growthSignal, inflationSignal, rawInputs, recession } = result;

  const expectGrowthRising = quadrant === "Recovery" || quadrant === "Overheat";
  const expectInflationRising = quadrant === "Overheat" || quadrant === "Stagflation";

  const checks: ConfidenceCheck[] = [
    {
      label: expectGrowthRising ? "Growth rising, as this regime expects" : "Growth falling, as this regime expects",
      passed: expectGrowthRising ? growthSignal === "Rising" : growthSignal === "Falling",
    },
    {
      label: expectInflationRising ? "Inflation rising, as this regime expects" : "Inflation falling, as this regime expects",
      passed: expectInflationRising ? inflationSignal === "Rising" : inflationSignal === "Falling",
    },
    {
      label: "Yield curve not signaling recession",
      passed: !recession.curveInverted,
    },
    {
      label: "Employment trend improving (unemployment falling)",
      passed: rawInputs.unemploymentTrend === "Falling",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return { score, checks };
}
