import { kv, KV_KEYS } from "./kv";
import { NarrativeSet } from "./narrativeEngine";

function generateId(): string {
  return `narr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveNewNarrative(set: Omit<NarrativeSet, "id" | "status" | "evaluations">): Promise<NarrativeSet> {
  const record: NarrativeSet = {
    ...set,
    id: generateId(),
    status: "Unresolved",
    evaluations: [],
  };
  await kv.set(KV_KEYS.narrativeById(record.id), JSON.stringify(record));
  await kv.lpush(KV_KEYS.narrativeLog, record.id);
  return record;
}

export async function getNarrative(id: string): Promise<NarrativeSet | null> {
  const raw = await kv.get<string | NarrativeSet>(KV_KEYS.narrativeById(id));
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function updateNarrative(record: NarrativeSet): Promise<void> {
  // Overwrites the record at its own key with the new evaluation appended —
  // the full history of evaluations lives inside the record's own
  // `evaluations` array (see narrativeEngine.ts), which is only ever
  // prepended to, never cleared. The record itself is never deleted or
  // replaced by a different narrative; this is purely "add new information
  // to this specific narrative's timeline."
  await kv.set(KV_KEYS.narrativeById(record.id), JSON.stringify(record));
}

export async function getNarrativeHistory(limit = 50): Promise<NarrativeSet[]> {
  const ids = await kv.lrange(KV_KEYS.narrativeLog, 0, limit - 1);
  const records = await Promise.all(ids.map((id) => getNarrative(id)));
  return records.filter((r): r is NarrativeSet => r !== null);
}

export async function getUnresolvedNarratives(): Promise<NarrativeSet[]> {
  const all = await getNarrativeHistory(200);
  return all.filter((n) => n.status === "Unresolved");
}
