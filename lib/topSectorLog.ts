import { kv, KV_KEYS } from "./kv";

/**
 * Call with the current Top 3 sector names on every /api/invest request.
 * Returns the date each one's CURRENT streak began — not today's date,
 * and not reset on every refresh. A sector that drops out of the Top 3
 * and later re-enters gets a fresh start date, since that's a new
 * recommendation period, which is the whole point of showing this at all:
 * "has this been running a while, or did it just start?"
 */
export async function trackTopSectorSince(currentTopSectorNames: string[]): Promise<Record<string, string>> {
  const tracked = await kv.smembers(KV_KEYS.topSectorTrackedSet);

  const enteredNow = currentTopSectorNames.filter((s) => !tracked.includes(s));
  const droppedOut = tracked.filter((s) => !currentTopSectorNames.includes(s));

  await Promise.all([
    ...enteredNow.map(async (s) => {
      await kv.sadd(KV_KEYS.topSectorTrackedSet, s);
      await kv.set(KV_KEYS.topSectorSince(s), new Date().toISOString());
    }),
    ...droppedOut.map(async (s) => {
      await kv.srem(KV_KEYS.topSectorTrackedSet, s);
      await kv.del(KV_KEYS.topSectorSince(s));
    }),
  ]);

  const result: Record<string, string> = {};
  await Promise.all(
    currentTopSectorNames.map(async (s) => {
      result[s] = (await kv.get<string>(KV_KEYS.topSectorSince(s))) ?? new Date().toISOString();
    })
  );
  return result;
}
