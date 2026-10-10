"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Login failed.");
      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900/60 p-8">
        <h1 className="text-lg font-semibold text-neutral-100 mb-1">Owner login</h1>
        <p className="text-xs text-neutral-500 mb-6">Restricted area — admin dashboard access.</p>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md text-sm px-3 py-2 text-neutral-100 mb-4"
        />
        {error && <p className="text-xs text-[#D9614F] mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm px-4 py-2 text-neutral-100 transition-colors disabled:opacity-50"
        >
          {loading ? "Checking…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
