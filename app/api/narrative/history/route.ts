import { NextRequest, NextResponse } from "next/server";
import { getNarrativeHistory } from "@/lib/narrativeLog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const assetId = req.nextUrl.searchParams.get("assetId");
    const all = await getNarrativeHistory(100);
    const filtered = assetId ? all.filter((n) => n.assetId === assetId) : all;
    return NextResponse.json({ narratives: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
