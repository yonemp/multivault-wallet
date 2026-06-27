import { NextRequest, NextResponse } from "next/server";
import {
  verifyVerificationCode,
  type VerificationChannel,
} from "@/lib/platform/verification-server";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      channel?: VerificationChannel;
      destination?: string;
      code?: string;
      purpose?: "2fa" | "contact";
    };

    if (!body.channel || !body.destination?.trim() || !body.code?.trim()) {
      return NextResponse.json({ error: "channel, destination, and code required" }, { status: 400 });
    }

    const valid = await verifyVerificationCode({
      channel: body.channel,
      destination: body.destination,
      code: body.code,
      purpose: body.purpose,
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 },
    );
  }
}