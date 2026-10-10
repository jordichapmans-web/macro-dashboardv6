"use client";

import { useEffect, useState } from "react";
import { PageShell, Card } from "@/components/PageShell";
import { SubscribeForm } from "@/components/SubscribeForm";

type LogEntry = {
  date: string;
  from: string | null;
  to: string;
  reason: string[];
  macroScore: number;
};

function formatMonthYear(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function UpdateLogPage() {
  const [log, setLog] = useState<LogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/update-log")
      .then((r) => r.json())
      .then((json) => (json.error ? setError(json.error) : setLog(json.log)))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <PageShell
      title="Update log"
      subtitle="A dated record of every macro regime change this platform has detected, and why."
    >
      {error && <p className="text-red-400 font-mono text-sm mb-6">{error}</p>}
      {!log && !error && <p className="text-neutral-400 font-mono text-sm mb-6">Loading history…</p>}

      {log && log.length === 0 && (
        <Card className="mb-8">
          <p className="text-sm text-neutral-400">
            No regime changes have been logged yet. Once the automated daily check detects the first
            transition, it will appear here with a full explanation.
          </p>
        </Card>
      )}

      {log && log.length > 0 && (
        <div className="space-y-4 mb-10">
          {log.map((entry, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-mono text-neutral-500">{formatMonthYear(entry.date)}</p>
                <span className="text-xs font-mono text-neutral-600">Macro Score at the time: {entry.macroScore}</span>
              </div>
              <p className="text-base text-neutral-100 mb-3">
                {entry.from ? (
                  <>
                    <span className="text-neutral-400">{entry.from}</span>
                    <span className="mx-2 text-neutral-600">→</span>
                    <span className="font-semibold">{entry.to}</span>
                  </>
                ) : (
                  <>First recorded regime: <span className="font-semibold">{entry.to}</span></>
                )}
              </p>
              {entry.reason.length > 0 && (
                <ul className="space-y-1">
                  {entry.reason.map((r, j) => (
                    <li key={j} className="text-sm text-neutral-400 flex gap-2">
                      <span className="text-neutral-600">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card title="Get notified when the regime changes">
        <SubscribeForm />
      </Card>
    </PageShell>
  );
}
