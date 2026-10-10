import { kv, KV_KEYS } from "./kv";

export type CampaignLogEntry = {
  sentAt: string;
  subject: string;
  target: "selected" | "all";
  succeeded: number;
  failed: number;
};

export async function appendCampaignLog(entry: CampaignLogEntry): Promise<void> {
  await kv.lpush(KV_KEYS.campaignLog, JSON.stringify(entry));
}

export async function getCampaignLog(limit = 50): Promise<CampaignLogEntry[]> {
  const raw = await kv.lrange(KV_KEYS.campaignLog, 0, limit - 1);
  return raw.map((r) => (typeof r === "string" ? JSON.parse(r) : r));
}
