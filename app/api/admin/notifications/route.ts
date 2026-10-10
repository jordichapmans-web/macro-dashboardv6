import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/auth";
import { getRegimeLog } from "@/lib/regimeLog";
import { getCampaignLog } from "@/lib/campaignLog";
import { listSubscribers } from "@/lib/subscribers";
import { fetchAllSeries } from "@/lib/fred";
import { runMacroEngine } from "@/lib/macroEngine";
import { computeConfidence } from "@/lib/confidenceEngine";

export async function GET(req: NextRequest) {
  if (!(await isAuthorizedRequest(req))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const apiKey = process.env.FRED_API_KEY;

  try {
    const [regimeLog, campaignLog, subscribers] = await Promise.all([
      getRegimeLog(10),
      getCampaignLog(20),
      listSubscribers(),
    ]);

    // "Upcoming regime change alerts" — this is necessarily a heuristic, not
    // a prediction. A low confidence score means the current classification
    // is only weakly supported, which is the closest honest proxy for "this
    // regime may be close to flipping" without claiming to forecast anything.
    let proximityAdvisory: { confidence: number; note: string } | null = null;
    if (apiKey) {
      const data = await fetchAllSeries(apiKey);
      const macro = runMacroEngine(data);
      const confidence = computeConfidence(macro);
      proximityAdvisory = {
        confidence: confidence.score,
        note:
          confidence.score >= 75
            ? "Current regime is strongly supported by the underlying signals — no transition indicated."
            : confidence.score >= 50
            ? "Some underlying signals disagree with the current regime — worth monitoring for a possible transition."
            : "Underlying signals are mixed — the current regime classification is only weakly supported right now.",
      };
    }

    const latestCampaign = campaignLog[0] ?? null;
    const failedDeliveries = campaignLog.reduce((sum, c) => sum + c.failed, 0);

    return NextResponse.json({
      recentRegimeChanges: regimeLog,
      subscriberCount: subscribers.length,
      notificationHistory: campaignLog,
      latestNotification: latestCampaign,
      totalFailedDeliveries: failedDeliveries,
      proximityAdvisory,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
