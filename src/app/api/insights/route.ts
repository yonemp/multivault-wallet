import { NextResponse } from "next/server";
import { INSIGHT_SECTIONS } from "@/lib/ai/copilot-engine";
import { fetchMarketSnapshot } from "@/lib/ai/market-context";

export async function GET() {
  try {
    const snapshot = await fetchMarketSnapshot();
    return NextResponse.json({
      snapshot,
      sections: INSIGHT_SECTIONS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Insights error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}