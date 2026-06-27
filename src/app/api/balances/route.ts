import { NextRequest, NextResponse } from "next/server";
import { fetchChainBalances } from "@/lib/wallet/balance-fetch";
import { ChainId } from "@/lib/wallet/chains";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      addresses?: Partial<Record<ChainId, string>>;
    };

    if (!body.addresses || typeof body.addresses !== "object") {
      return NextResponse.json(
        { error: "addresses object required" },
        { status: 400 },
      );
    }

    const balances = await fetchChainBalances(body.addresses);
    return NextResponse.json({ balances });
  } catch (err) {
    console.error("Balance API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch balances" },
      { status: 500 },
    );
  }
}