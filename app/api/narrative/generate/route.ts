import { NextRequest, NextResponse } from "next/server";
import { generateScenarios } from "@/lib/narrativeEngine";
import { saveNewNarrative } from "@/lib/narrativeLog";
import { RISK_ASSETS, RiskAssetId } from "@/lib/narrativeAssets";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing FRED_API_KEY." }, { status: 500 });

  try {
    const { assetId } = await req.json();
    const asset = RISK_ASSETS.find((a) => a.id === assetId);
    if (!asset) return NextResponse.json({ error: "Unsupported risk asset." }, { status: 400 });

    const { keyMetric, scenarios } = await generateScenarios(asset.id as RiskAssetId, apiKey);
    const record = await saveNewNarrative({
      assetId: asset.id,
      assetLabel: asset.label,
      createdAt: new Date().toISOString(),
      keyMetric,
      scenarios,
    });
    return NextResponse.json(record);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 502 });
  }
}
