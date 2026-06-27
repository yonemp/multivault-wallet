import { NextRequest, NextResponse } from "next/server";
import {
  sendVerificationCode,
  verificationChannelsConfigured,
  type VerificationChannel,
} from "@/lib/platform/verification-server";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      channel?: VerificationChannel;
      destination?: string;
      purpose?: "2fa" | "contact";
    };

    const channel = body.channel;
    const destination = body.destination?.trim();

    if (!channel || !destination) {
      return NextResponse.json({ error: "channel and destination required" }, { status: 400 });
    }
    if (channel !== "email" && channel !== "phone") {
      return NextResponse.json({ error: "channel must be email or phone" }, { status: 400 });
    }

    const configured = verificationChannelsConfigured();
    if (channel === "email" && !configured.email) {
      return NextResponse.json(
        { error: "Email verification not configured — add RESEND_API_KEY to environment" },
        { status: 503 },
      );
    }
    if (channel === "phone" && !configured.sms) {
      return NextResponse.json(
        { error: "SMS verification not configured — add Twilio credentials to environment" },
        { status: 503 },
      );
    }

    const result = await sendVerificationCode({
      channel,
      destination,
      purpose: body.purpose,
    });

    return NextResponse.json({ ok: true, masked: result.masked });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send code";
    const status = message.includes("not configured") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  const configured = verificationChannelsConfigured();
  return NextResponse.json({ channels: configured });
}