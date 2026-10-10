import { kv, KV_KEYS } from "./kv";
import { MacroResult, Quadrant } from "./macroEngine";

export type RegimeLogEntry = {
  date: string; // ISO date the change was detected
  from: Quadrant | null; // null for the very first entry ever logged
  to: Quadrant;
  reason: string[]; // plain-language bullets, pulled from the macro engine's own explanations
  macroScore: number;
};

/**
 * Call this once per scheduled run (see app/api/cron/regime-check/route.ts).
 * Compares the current quadrant against the last logged one. If it's
 * different, appends a new dated entry and returns it (so the caller can
 * trigger the owner-notification workflow). If unchanged, returns null and
 * does nothing — per the spec, "if the regime remains unchanged, take no action."
 *
 * IMPORTANT: this only reads/reformats the macro engine's own outputs
 * (quadrant, explanations, score). It does not alter any calculation.
 */
export async function detectAndLogRegimeChange(macro: MacroResult): Promise<RegimeLogEntry | null> {
  const previous = await kv.get<Quadrant>(KV_KEYS.lastKnownQuadrant);

  if (previous === macro.quadrant) {
    return null; // no change — nothing to do
  }

  const entry: RegimeLogEntry = {
    date: new Date().toISOString(),
    from: previous ?? null,
    to: macro.quadrant,
    // Reuse the macro engine's own explanation strings — this is display
    // logic only, not a recalculation of anything.
    reason: macro.explanations,
    macroScore: macro.macroScore,
  };

  await kv.lpush(KV_KEYS.regimeLog, JSON.stringify(entry));
  await kv.set(KV_KEYS.lastKnownQuadrant, macro.quadrant);

  return entry;
}

export async function getRegimeLog(limit = 50): Promise<RegimeLogEntry[]> {
  const raw = await kv.lrange(KV_KEYS.regimeLog, 0, limit - 1);
  return raw.map((r) => (typeof r === "string" ? JSON.parse(r) : r));
}
