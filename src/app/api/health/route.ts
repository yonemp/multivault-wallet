import { NextRequest, NextResponse } from "next/server";

type HealthPayload = {
  type?: string;
  message?: string;
  stack?: string;
  url?: string;
  timestamp?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HealthPayload;
    if (body.type && body.type !== "info") {
      console.error("[client-health]", {
        type: body.type,
        message: body.message,
        url: body.url,
        at: body.timestamp ? new Date(body.timestamp).toISOString() : undefined,
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "multivault-health" });
}