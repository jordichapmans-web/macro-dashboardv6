"use client";

import { useState } from "react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setStatus("done");
      setMessage(
        json.confirmationSent
          ? "You're subscribed — check your inbox for a confirmation email, and you'll hear from us whenever the macro regime changes."
          : "You're subscribed — you'll receive an email whenever the macro regime changes."
      );
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  if (status === "done") {
    return <p className="text-sm text-[#4FBF8B]">{message}</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md text-sm px-3 py-2 text-neutral-100 placeholder:text-neutral-600"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm px-4 py-2 text-neutral-100 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Subscribing…" : "Notify me on regime change"}
      </button>
      {status === "error" && <p className="text-xs text-[#D9614F] sm:self-center">{message}</p>}
    </form>
  );
}
