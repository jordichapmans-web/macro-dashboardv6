import { NextRequest, NextResponse } from "next/server";
import { evaluateNarrative } from "@/lib/narrativeEngine";
import { getUnresolvedNarratives, updateNarrative } from "@/lib/narrativeLog";

export const dynamic = "force-dynamic";

// Daily job: re-evaluates every still-unresolved narrative against the
// latest data and logs the result. Previous narratives are never deleted.
export async function GET(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && req.headers.get("authorization") !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing FRED_API_KEY." }, { status: 500 });

  try {
    const open = await getUnresolvedNarratives();
    let evaluated = 0;
    for (const n of open) {
      try {
        const updated = await evaluateNarrative(n, apiKey);
        await updateNarrative(updated);
        evaluated++;
      } catch {
        // skip this one, continue with the rest
      }
    }
    return NextResponse.json({ checkedAt: new Date().toISOString(), openNarratives: open.length, evaluated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
