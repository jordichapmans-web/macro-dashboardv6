import { kv } from "@vercel/kv";

/**
 * All persistent storage in this app goes through Vercel KV (a free,
 * dashboard-provisioned Redis instance — no schema, no migrations).
 * Three logical collections, all namespaced by key prefix:
 *   subscribers:*     — email subscriber list
 *   regime-log        — a single list of dated regime-change entries
 *   draft-email        — the current pending admin-approval email draft
 */
export const KV_KEYS = {
  subscribers: "subscribers", // Redis set of email addresses
  subscriberMeta: (email: string) => `subscriber-meta:${email}`, // subscribed-at timestamp
  regimeLog: "regime-log", // Redis list, newest first, JSON-encoded entries
  lastKnownQuadrant: "last-known-quadrant",
  draftEmail: "draft-email",
  campaignLog: "campaign-log", // Redis list, newest first — sent-notification history
  topSectorSince: (sector: string) => `top-sector-since:${sector}`, // ISO date the current streak began
  topSectorTrackedSet: "top-sector-tracked", // Redis set of sectors currently in a tracked streak
  narrativeLog: "narrative-log", // Redis list, newest first — every generated narrative set
  narrativeById: (id: string) => `narrative:${id}`, // individual narrative record, mutated as it's evaluated
} as const;

export { kv };
