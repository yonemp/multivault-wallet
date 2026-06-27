import { NextRequest, NextResponse } from "next/server";

export type PulseToken = {
  id: string;
  symbol: string;
  name: string;
  address: string;
  pairAddress: string;
  mcap: number;
  liquidity: number;
  volume: number;
  age: string;
  ageMs: number;
  txCount: number;
  holders: number;
  change5m: number;
  change1h: number;
  change6h: number;
  change24h: number;
  volume5m: number;
  volume1h: number;
  volume24h: number;
  column: "new" | "final" | "migrated";
  protocol: string;
  priceUsd: number;
  pairUrl: string;
};

type DexPair = {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  marketCap?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number; h1?: number; m5?: number };
  txns?: { m5?: { buys?: number; sells?: number }; h1?: { buys?: number; sells?: number }; h24?: { buys?: number; sells?: number } };
  priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
  pairCreatedAt?: number;
  url?: string;
};

function formatAge(ms: number) {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

function classifyPair(pair: DexPair): PulseToken["column"] {
  const ageMs = pair.pairCreatedAt ? Date.now() - pair.pairCreatedAt : 0;
  const liq = pair.liquidity?.usd ?? 0;
  const dex = pair.dexId?.toLowerCase() ?? "";

  if (dex.includes("raydium") || dex.includes("orca") || liq > 80_000) return "migrated";
  if (ageMs < 20 * 60_000 || liq < 15_000) return "new";
  return "final";
}

function mapPair(pair: DexPair): PulseToken | null {
  if (pair.chainId !== "solana" || !pair.baseToken?.symbol) return null;
  const ageMs = pair.pairCreatedAt ? Date.now() - pair.pairCreatedAt : 0;
  const tx5m = (pair.txns?.m5?.buys ?? 0) + (pair.txns?.m5?.sells ?? 0);
  const tx24 = (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0);

  return {
    id: `sol-${pair.baseToken.address}`,
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name ?? pair.baseToken.symbol,
    address: pair.baseToken.address,
    pairAddress: pair.pairAddress,
    mcap: pair.marketCap ?? 0,
    liquidity: pair.liquidity?.usd ?? 0,
    volume: pair.volume?.h24 ?? pair.volume?.m5 ?? 0,
    age: pair.pairCreatedAt ? formatAge(ageMs) : "—",
    ageMs,
    txCount: tx5m || tx24,
    holders: 0,
    change5m: pair.priceChange?.m5 ?? 0,
    change1h: pair.priceChange?.h1 ?? 0,
    change6h: pair.priceChange?.h6 ?? 0,
    change24h: pair.priceChange?.h24 ?? 0,
    volume5m: pair.volume?.m5 ?? 0,
    volume1h: pair.volume?.h1 ?? 0,
    volume24h: pair.volume?.h24 ?? 0,
    column: classifyPair(pair),
    protocol: pair.dexId ?? "unknown",
    priceUsd: parseFloat(pair.priceUsd ?? "0"),
    pairUrl: pair.url ?? `https://dexscreener.com/solana/${pair.pairAddress}`,
  };
}

async function fetchPairsForTokens(addresses: string[]): Promise<DexPair[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < addresses.length; i += 30) {
    chunks.push(addresses.slice(i, i + 30));
  }

  const all: DexPair[] = [];
  for (const chunk of chunks) {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) continue;
    const data = (await res.json()) as { pairs?: DexPair[] };
    if (data.pairs) all.push(...data.pairs);
  }
  return all;
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("q")?.trim();

    let addresses: string[] = [];

    if (search) {
      const searchRes = await fetch(
        `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(search)}`,
        { next: { revalidate: 30 } },
      );
      if (searchRes.ok) {
        const data = (await searchRes.json()) as { pairs?: DexPair[] };
        addresses = [
          ...new Set(
            (data.pairs ?? [])
              .filter((p) => p.chainId === "solana")
              .map((p) => p.baseToken.address),
          ),
        ].slice(0, 40);
      }
    } else {
      const [boostsRes, profilesRes] = await Promise.all([
        fetch("https://api.dexscreener.com/token-boosts/latest/v1", { next: { revalidate: 30 } }),
        fetch("https://api.dexscreener.com/token-profiles/latest/v1", { next: { revalidate: 30 } }),
      ]);

      const boosts = boostsRes.ok ? ((await boostsRes.json()) as Array<{ chainId: string; tokenAddress: string }>) : [];
      const profiles = profilesRes.ok ? ((await profilesRes.json()) as Array<{ chainId: string; tokenAddress: string }>) : [];

      addresses = [
        ...new Set(
          [...boosts, ...profiles]
            .filter((t) => t.chainId === "solana" && t.tokenAddress)
            .map((t) => t.tokenAddress),
        ),
      ].slice(0, 60);
    }

    if (!addresses.length) {
      return NextResponse.json({ tokens: [], source: "dexscreener" });
    }

    const pairs = await fetchPairsForTokens(addresses);

    const bestByToken = new Map<string, DexPair>();
    for (const pair of pairs) {
      const addr = pair.baseToken?.address;
      if (!addr) continue;
      const existing = bestByToken.get(addr);
      const liq = pair.liquidity?.usd ?? 0;
      const existingLiq = existing?.liquidity?.usd ?? 0;
      if (!existing || liq > existingLiq) bestByToken.set(addr, pair);
    }

    const tokens = [...bestByToken.values()]
      .map(mapPair)
      .filter((t): t is PulseToken => t !== null)
      .sort((a, b) => b.volume - a.volume);

    return NextResponse.json({ tokens, source: "dexscreener", updatedAt: Date.now() });
  } catch (err) {
    console.error("Pulse API error:", err);
    return NextResponse.json({ error: "Failed to fetch live pulse data" }, { status: 500 });
  }
}