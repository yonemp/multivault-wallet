import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Admin not configured — set ADMIN_SECRET in Vercel env" },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as { key?: string };
    const key = body.key?.trim();
    if (!key) {
      return NextResponse.json({ error: "Admin key required" }, { status: 400 });
    }
    if (key !== secret) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}