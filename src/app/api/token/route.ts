import { NextRequest, NextResponse } from "next/server";

type PumpCoin = {
  mint: string;
  symbol: string;
  name: string;
  usd_market_cap?: number;
  market_cap?: number;
  complete?: boolean;
  real_sol_reserves?: number;
  real_quote_reserves?: number;
  reply_count?: number;
  image_uri?: string;
  bonding_curve?: string;
  pump_swap_pool?: string | null;
  is_currently_live?: boolean;
  virtual_sol_reserves?: number;
};

const PUMP_HEADERS = {
  Accept: "application/json",
  Origin: "https://pump.fun",
  Referer: "https://pump.fun/",
};

function bondingProgress(coin: PumpCoin) {
  if (coin.complete) return 100;
  const lamports = coin.real_sol_reserves ?? coin.real_quote_reserves ?? 0;
  return lamports > 0 ? Math.min(99, (lamports / 85_000_000_000) * 100) : 0;
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://frontend-api-v3.pump.fun/coins/${address}`, {
      headers: PUMP_HEADERS,
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Token not found on pump.fun" }, { status: 404 });
    }

    const coin = (await res.json()) as PumpCoin;
    const mcap = coin.usd_market_cap ?? 0;
    const progress = bondingProgress(coin);

    const pair = {
      pairAddress: coin.bonding_curve ?? coin.mint,
      baseToken: { address: coin.mint, name: coin.name, symbol: coin.symbol },
      priceUsd: mcap > 0 ? String(mcap / 1_000_000_000) : "0",
      marketCap: mcap,
      liquidity: { usd: (coin.real_sol_reserves ?? 0) / 1e9 * 140 },
      volume: { m5: 0, h1: 0, h24: 0 },
      txns: { m5: { buys: 0, sells: coin.reply_count ?? 0 } },
      priceChange: { m5: 0, h1: 0, h24: 0 },
      url: `https://pump.fun/coin/${coin.mint}`,
      dexId: "pump.fun",
      bondingProgress: progress,
      isLive: coin.is_currently_live,
      imageUri: coin.image_uri,
    };

    return NextResponse.json({ pair, source: "pump.fun" });
  } catch (err) {
    console.error("Token API error:", err);
    return NextResponse.json({ error: "Failed to fetch token" }, { status: 500 });
  }
}