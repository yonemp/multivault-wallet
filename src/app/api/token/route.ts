import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      { next: { revalidate: 15 } },
    );
    if (!res.ok) throw new Error(`DexScreener ${res.status}`);
    const data = await res.json();
    const pairs = (data.pairs ?? []).filter((p: { chainId: string }) => p.chainId === "solana");
    const best = pairs.sort(
      (a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
        (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0),
    )[0];

    return NextResponse.json({ pair: best ?? null, pairs });
  } catch (err) {
    console.error("Token API error:", err);
    return NextResponse.json({ error: "Failed to fetch token" }, { status: 500 });
  }
}