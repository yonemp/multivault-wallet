import { listWallets } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const wallets = listWallets();
    return NextResponse.json({ wallets });
  } catch {
    return NextResponse.json({ error: "Failed to load wallets" }, { status: 500 });
  }
}