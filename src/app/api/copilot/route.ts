import { NextRequest, NextResponse } from "next/server";
import { generateCopilotReply, type CopilotMessage } from "@/lib/ai/copilot-engine";
import { fetchMarketSnapshot } from "@/lib/ai/market-context";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { messages?: CopilotMessage[] };
    const messages = body.messages ?? [];

    if (!messages.length || messages.length > 20) {
      return NextResponse.json({ error: "Invalid message history" }, { status: 400 });
    }

    const last = messages[messages.length - 1];
    if (last.role !== "user" || last.content.length > 2000) {
      return NextResponse.json({ error: "Invalid user message" }, { status: 400 });
    }

    const snapshot = await fetchMarketSnapshot();
    const { reply, mode } = await generateCopilotReply(messages, snapshot);

    return NextResponse.json({ reply, mode, snapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Copilot error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}