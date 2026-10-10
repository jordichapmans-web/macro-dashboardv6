import { NextRequest, NextResponse } from "next/server";
import { evaluateNarrative } from "@/lib/narrativeEngine";
import { getNarrative, updateNarrative } from "@/lib/narrativeLog";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing FRED_API_KEY." }, { status: 500 });

  try {
    const { id } = await req.json();
    const narrative = await getNarrative(id);
    if (!narrative) return NextResponse.json({ error: "Narrative not found." }, { status: 404 });

    const updated = await evaluateNarrative(narrative, apiKey);
    await updateNarrative(updated);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 502 });
  }
}
