import { kv, KV_KEYS } from "./kv";

export type Subscriber = { email: string; subscribedAt: string };

export async function addSubscriber(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await kv.sadd(KV_KEYS.subscribers, normalized);
  // Only set the subscribed-at timestamp if this is a new subscriber —
  // don't overwrite it if someone re-submits the form.
  const existing = await kv.get(KV_KEYS.subscriberMeta(normalized));
  if (!existing) {
    await kv.set(KV_KEYS.subscriberMeta(normalized), new Date().toISOString());
  }
}

export async function removeSubscriber(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await kv.srem(KV_KEYS.subscribers, normalized);
  await kv.del(KV_KEYS.subscriberMeta(normalized));
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const emails = await kv.smembers(KV_KEYS.subscribers);
  const withMeta = await Promise.all(
    emails.map(async (email) => ({
      email,
      subscribedAt: (await kv.get<string>(KV_KEYS.subscriberMeta(email))) ?? "unknown",
    }))
  );
  return withMeta.sort((a, b) => a.subscribedAt.localeCompare(b.subscribedAt));
}

export function subscribersToCsv(subs: Subscriber[]): string {
  const header = "email,subscribed_at";
  const rows = subs.map((s) => `${s.email},${s.subscribedAt}`);
  return [header, ...rows].join("\n");
}
