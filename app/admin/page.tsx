"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell, Card } from "@/components/PageShell";

type Subscriber = { email: string; subscribedAt: string };
type RegimeSummary = {
  latestEntry: { date: string; from: string | null; to: string; reason: string[] } | null;
  draft: { subject: string; body: string } | null;
  topSectors: { sector: string; score: number }[];
};
type NotificationsSummary = {
  recentRegimeChanges: { date: string; from: string | null; to: string }[];
  subscriberCount: number;
  notificationHistory: { sentAt: string; subject: string; target: string; succeeded: number; failed: number }[];
  latestNotification: { sentAt: string; subject: string; succeeded: number; failed: number } | null;
  totalFailedDeliveries: number;
  proximityAdvisory: { confidence: number; note: string } | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null);
  const [summary, setSummary] = useState<RegimeSummary | null>(null);
  const [notifications, setNotifications] = useState<NotificationsSummary | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendTarget, setSendTarget] = useState<"selected" | "all">("selected");
  const [confirming, setConfirming] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/subscribers").then((r) => r.json().then((j) => ({ status: r.status, json: j }))),
      fetch("/api/admin/regime-summary").then((r) => r.json().then((j) => ({ status: r.status, json: j }))),
      fetch("/api/admin/notifications").then((r) => r.json().then((j) => ({ status: r.status, json: j }))),
    ]).then(([subsRes, sumRes, notifRes]) => {
      if (subsRes.status === 401 || sumRes.status === 401 || notifRes.status === 401) {
        setAuthError(true);
        router.push("/admin/login");
        return;
      }
      setSubscribers(subsRes.json.subscribers);
      setSummary(sumRes.json);
      setNotifications(notifRes.json);
      if (sumRes.json.draft) {
        setSubject(sumRes.json.draft.subject);
        setBody(sumRes.json.draft.body);
      }
    });
  }, [router]);

  function toggleSelect(email: string) {
    const next = new Set(selected);
    next.has(email) ? next.delete(email) : next.add(email);
    setSelected(next);
  }

  function toggleSelectAll() {
    if (!subscribers) return;
    setSelected(selected.size === subscribers.length ? new Set() : new Set(subscribers.map((s) => s.email)));
  }

  async function removeSubscriber(email: string) {
    await fetch("/api/admin/subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubscribers((subs) => subs?.filter((s) => s.email !== email) ?? null);
  }

  async function sendCampaign() {
    setConfirming(false);
    const res = await fetch("/api/admin/send-campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        body,
        target: sendTarget,
        selectedEmails: Array.from(selected),
        confirmed: true,
      }),
    });
    const json = await res.json();
    setSendResult(json);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (authError) return null;

  const filtered = subscribers?.filter((s) => s.email.includes(search.toLowerCase())) ?? [];

  return (
    <PageShell title="Admin dashboard" subtitle="Subscriber management, regime change summary, and campaign sending.">
      <button onClick={logout} className="text-xs text-neutral-500 hover:text-neutral-300 mb-6 underline">
        Log out
      </button>

      {summary?.latestEntry && (
        <Card title="Regime change summary" className="mb-8">
          <p className="text-sm text-neutral-100 mb-2">
            {summary.latestEntry.from ?? "n/a"} → <strong>{summary.latestEntry.to}</strong>
          </p>
          <ul className="text-xs text-neutral-400 space-y-1 mb-3">
            {summary.latestEntry.reason.slice(0, 4).map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
          <p className="text-xs text-neutral-500">
            Top sectors: {summary.topSectors.map((s) => `${s.sector} (${s.score})`).join(", ")}
          </p>
        </Card>
      )}

      {notifications && (
        <Card title="Notifications management" className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs text-neutral-500">Subscribers</p>
              <p className="text-lg font-mono text-neutral-100">{notifications.subscriberCount}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Failed deliveries (all time)</p>
              <p className="text-lg font-mono text-neutral-100">{notifications.totalFailedDeliveries}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Latest notification sent</p>
              <p className="text-sm text-neutral-200">
                {notifications.latestNotification ? new Date(notifications.latestNotification.sentAt).toLocaleString() : "None yet"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Regime confidence</p>
              <p className="text-lg font-mono text-neutral-100">{notifications.proximityAdvisory?.confidence ?? "—"}%</p>
            </div>
          </div>

          {notifications.proximityAdvisory && (
            <div className="rounded-lg border border-neutral-800 p-3 mb-6 text-xs text-neutral-400">
              {notifications.proximityAdvisory.note}
            </div>
          )}

          <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">Recent regime changes</p>
          <div className="mb-6">
            {notifications.recentRegimeChanges.length === 0 && (
              <p className="text-xs text-neutral-500">None logged yet.</p>
            )}
            {notifications.recentRegimeChanges.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-neutral-800 last:border-0">
                <span className="text-neutral-300">{c.from ?? "n/a"} → {c.to}</span>
                <span className="text-xs text-neutral-500 font-mono">{new Date(c.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>

          <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">Notification history</p>
          {notifications.notificationHistory.length === 0 && (
            <p className="text-xs text-neutral-500">No campaigns sent yet.</p>
          )}
          {notifications.notificationHistory.map((n, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-neutral-800 last:border-0">
              <span className="text-neutral-300">{n.subject}</span>
              <span className="text-xs text-neutral-500 font-mono">
                {new Date(n.sentAt).toLocaleDateString()} · {n.succeeded} sent, {n.failed} failed
              </span>
            </div>
          ))}
        </Card>
      )}

      <Card title="Email composer" className="mb-8">
        <label className="text-xs text-neutral-500">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md text-sm px-3 py-2 text-neutral-100 mt-1 mb-4"
        />
        <label className="text-xs text-neutral-500">Body (HTML)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md text-sm px-3 py-2 text-neutral-100 mt-1 font-mono"
        />

        <div className="flex items-center gap-4 mt-4">
          <label className="text-xs text-neutral-400 flex items-center gap-1.5">
            <input type="radio" checked={sendTarget === "selected"} onChange={() => setSendTarget("selected")} />
            Send to selected ({selected.size})
          </label>
          <label className="text-xs text-neutral-400 flex items-center gap-1.5">
            <input type="radio" checked={sendTarget === "all"} onChange={() => setSendTarget("all")} />
            Send to all ({subscribers?.length ?? 0})
          </label>
        </div>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="mt-4 rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm px-4 py-2 text-neutral-100"
          >
            Review & send
          </button>
        ) : (
          <div className="mt-4 rounded-lg border border-[#E0A83E]/40 bg-[#E0A83E]/10 p-4">
            <p className="text-sm text-neutral-200 mb-3">
              Confirm sending to {sendTarget === "all" ? subscribers?.length ?? 0 : selected.size} recipient(s)?
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={sendCampaign} className="rounded-md bg-[#D9614F] text-sm px-4 py-2 text-white">
                Confirm & send
              </button>
              <button onClick={() => setConfirming(false)} className="rounded-md bg-neutral-700 text-sm px-4 py-2 text-neutral-100">
                Cancel
              </button>
            </div>
          </div>
        )}

        {sendResult && (
          <div className="mt-4 text-sm text-neutral-300">
            {sendResult.error ? (
              <p className="text-[#D9614F]">{sendResult.error}</p>
            ) : (
              <p>
                Sent at {new Date(sendResult.sentAt).toLocaleString()} — {sendResult.succeeded} succeeded,{" "}
                {sendResult.failed} failed.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card title="Subscribers">
        <div className="flex items-center justify-between mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email…"
            className="bg-neutral-800 border border-neutral-700 rounded-md text-sm px-3 py-1.5 text-neutral-100"
          />
          <div className="flex gap-3">
            <button onClick={toggleSelectAll} className="text-xs text-neutral-400 hover:text-neutral-200 underline">
              {selected.size === subscribers?.length ? "Deselect all" : "Select all"}
            </button>
            <a href="/api/admin/subscribers/export" className="text-xs text-neutral-400 hover:text-neutral-200 underline">
              Export CSV
            </a>
          </div>
        </div>

        <p className="text-xs text-neutral-500 mb-3">{subscribers?.length ?? 0} total subscribers</p>

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filtered.map((s) => (
            <div key={s.email} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0 text-sm">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={selected.has(s.email)} onChange={() => toggleSelect(s.email)} />
                <span className="text-neutral-200">{s.email}</span>
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-neutral-500">{new Date(s.subscribedAt).toLocaleDateString()}</span>
                <button onClick={() => removeSubscriber(s.email)} className="text-xs text-[#D9614F] hover:underline">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
