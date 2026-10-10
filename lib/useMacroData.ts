"use client";

import { useEffect, useState } from "react";
import type { MacroResult } from "./macroEngine";

export type MacroApiResponse = MacroResult & { generatedAt: string; error?: string };

export function useMacroData() {
  const [data, setData] = useState<MacroApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/macro")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
