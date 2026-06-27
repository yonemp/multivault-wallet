import { NextRequest, NextResponse } from "next/server";
import { formatPulseAge, solFromLamports } from "@/lib/pulse/format";

type PumpV3Coin = {
  mint: string;
  usd_market_cap?: number;
  market_cap?: number;
  created_timestamp?: number;
  real_quote_reserves?: number;
  real_sol_reserves?: number;
  reply_count?: number;
};

type PumpV2Coin = {
  coinMint: string;
  marketCap?: number;
  volume?: number;
  transactions?: number;
  buyTransactions?: number;
  sellTransactions?: number;
  numHolders?: number;
  numKolsTraded?: number;
  sniperCount?: number;
  sniperOwnedPercentage?: number;
  topHoldersPercentage?: number;
  devHoldingsPercentage?: number;
};

export type PulseTicker = {
  mcap: number;
  volume: number;
  ageMs: number;
  age: string;
  quoteReserves: number;
  solLiquidity: number;
  txCount: number;
  buyTx?: number;
  sellTx?: number;
  top10HoldersPct?: number;
  devHoldingPct?: number;
  snipersPct?: number;
  holders?: number;
  sniperCount?: number;
  proTraders?: number;
};

const PUMP_HEADERS = {
  Accept: "application/json",
  Origin: "https://pump.fun",
  Referer: "https://pump.fun/",
};

const SOL_USD_FALLBACK = 140;

let graduatedCache: { at: number; byMint: Map<string, PumpV2Coin> } | null = null;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: PUMP_HEADERS, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function graduatedByMint() {
  const now = Date.now();
  if (graduatedCache && now - graduatedCache.at < 30_000) {
    return graduatedCache.byMint;
  }
  const data = await fetchJson<{ coins: PumpV2Coin[] }>(
    "https://advanced-api-v2.pump.fun/coins/graduated",
  );
  const byMint = new Map<string, PumpV2Coin>();
  for (const c of data?.coins ?? []) {
    byMint.set(c.coinMint, c);
  }
  graduatedCache = { at: now, byMint };
  return byMint;
}

async function fetchSolUsd() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
      cache: "no-store",
    });
    if (!res.ok) return SOL_USD_FALLBACK;
    const data = (await res.json()) as { solana?: { usd?: number } };
    return data.solana?.usd ?? SOL_USD_FALLBACK;
  } catch {
    return SOL_USD_FALLBACK;
  }
}

function mapTicker(coin: PumpV3Coin, solUsd: number, v2?: PumpV2Coin): PulseTicker {
  const lamports = coin.real_quote_reserves ?? coin.real_sol_reserves ?? 0;
  const mcap =
    coin.usd_market_cap
    ?? (coin.market_cap != null ? coin.market_cap * solUsd : v2?.marketCap ?? 0);

  const volume =
    v2?.volume
    ?? (lamports > 0 ? (lamports / 1e9) * solUsd : 0);

  const ageMs = coin.created_timestamp ? Date.now() - coin.created_timestamp : 0;

  return {
    mcap,
    volume,
    ageMs,
    age: ageMs > 0 ? formatPulseAge(ageMs) : "—",
    quoteReserves: lamports,
    solLiquidity: solFromLamports(lamports),
    txCount: v2?.transactions ?? coin.reply_count ?? 0,
    buyTx: v2?.buyTransactions,
    sellTx: v2?.sellTransactions,
    top10HoldersPct: v2?.topHoldersPercentage,
    devHoldingPct: v2?.devHoldingsPercentage,
    snipersPct: v2?.sniperOwnedPercentage,
    holders: v2?.numHolders,
    sniperCount: v2?.sniperCount,
    proTraders: v2?.numKolsTraded,
  };
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("mints");
  if (!raw) {
    return NextResponse.json({ error: "mints required" }, { status: 400 });
  }

  const mints = raw.split(",").map((m) => m.trim()).filter(Boolean).slice(0, 80);
  if (!mints.length) {
    return NextResponse.json({ tickers: {}, updatedAt: Date.now() });
  }

  try {
    const [graduated, solUsd] = await Promise.all([graduatedByMint(), fetchSolUsd()]);

    const chunkSize = 12;
    const tickers: Record<string, PulseTicker> = {};

    for (let i = 0; i < mints.length; i += chunkSize) {
      const chunk = mints.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map(async (mint) => {
          const coin = await fetchJson<PumpV3Coin>(
            `https://frontend-api-v3.pump.fun/coins/${mint}?sync=true`,
          );
          if (!coin?.mint) return null;
          const v2 = graduated.get(mint);
          return [mint, mapTicker(coin, solUsd, v2)] as const;
        }),
      );
      for (const row of results) {
        if (row) tickers[row[0]] = row[1];
      }
    }

    return NextResponse.json({ tickers, solUsd, updatedAt: Date.now() });
  } catch (err) {
    console.error("Pulse tickers error:", err);
    return NextResponse.json({ error: "Failed to refresh tickers" }, { status: 500 });
  }
}