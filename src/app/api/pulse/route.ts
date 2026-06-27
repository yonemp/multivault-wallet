import { NextRequest, NextResponse } from "next/server";
import {
  addressSlug,
  formatPulseAge,
  solFromLamports,
  twitterHandle,
} from "@/lib/pulse/format";

export type PulseToken = {
  id: string;
  symbol: string;
  name: string;
  address: string;
  addressSlug: string;
  mcap: number;
  volume: number;
  age: string;
  ageMs: number;
  createdAt?: number;
  txCount: number;
  buyTx?: number;
  sellTx?: number;
  bondingProgress: number;
  column: "new" | "final" | "migrated";
  protocol: string;
  quoteToken: string;
  priceUsd: number;
  pairUrl: string;
  imageUri?: string;
  isLive?: boolean;
  hasTwitter?: boolean;
  hasTelegram?: boolean;
  hasWebsite?: boolean;
  twitterUrl?: string;
  creatorHandle?: string;
  creatorMetric?: string;
  dexPaid?: boolean;
  caEndsInPump?: boolean;
  recentVisitors?: number;
  top10HoldersPct?: number;
  devHoldingPct?: number;
  snipersPct?: number;
  insidersPct?: number;
  bundlePct?: number;
  holders?: number;
  sniperCount?: number;
  proTraders?: number;
  devMigrations?: number;
  devPairsCreated?: number;
  feePct?: number;
  solLiquidity?: number;
};

type PumpV3Coin = {
  mint: string;
  name: string;
  symbol: string;
  usd_market_cap?: number;
  market_cap?: number;
  created_timestamp?: number;
  complete?: boolean;
  real_sol_reserves?: number;
  real_quote_reserves?: number;
  virtual_sol_reserves?: number;
  reply_count?: number;
  is_currently_live?: boolean;
  image_uri?: string;
  pump_swap_pool?: string | null;
  raydium_pool?: string | null;
  protocol?: string;
  total_supply?: number;
  twitter?: string;
  telegram?: string;
  website?: string;
  quote_mint?: string;
  username?: string | null;
  creator?: string;
  is_cashback_enabled?: boolean;
};

type PumpV2Coin = {
  coinMint: string;
  name: string;
  ticker: string;
  marketCap?: number;
  volume?: number;
  transactions?: number;
  buyTransactions?: number;
  sellTransactions?: number;
  bondingCurveProgress?: number;
  creationTime?: number;
  graduationDate?: number;
  imageUrl?: string;
  numHolders?: number;
  numKolsTraded?: number;
  sniperCount?: number;
  sniperOwnedPercentage?: number;
  topHoldersPercentage?: number;
  devHoldingsPercentage?: number;
  dev?: string;
  platform?: string;
  program?: string;
  twitter?: string;
  twitterReuseCount?: number;
};

const PUMP_HEADERS = {
  Accept: "application/json",
  Origin: "https://pump.fun",
  Referer: "https://pump.fun/",
};

const GRADUATION_LAMPORTS = 85_000_000_000;

function creatorLine(coin: PumpV3Coin, v2?: PumpV2Coin) {
  const handle =
    coin.username?.trim()
    || twitterHandle(v2?.twitter ?? coin.twitter)
    || (coin.creator ? `${coin.creator.slice(0, 4)}…${coin.creator.slice(-4)}` : undefined);
  const metric = v2?.twitterReuseCount != null
    ? `${v2.twitterReuseCount} reuse`
    : v2?.numHolders != null
      ? `${v2.numHolders} holders`
      : undefined;
  return { creatorHandle: handle, creatorMetric: metric };
}

function bondingProgress(coin: PumpV3Coin | PumpV2Coin): number {
  if ("complete" in coin && coin.complete) return 100;
  if ("bondingCurveProgress" in coin && coin.bondingCurveProgress != null) {
    return Math.min(100, coin.bondingCurveProgress);
  }
  const lamports = (coin as PumpV3Coin).real_sol_reserves ?? (coin as PumpV3Coin).real_quote_reserves ?? 0;
  if (lamports > 0) return Math.min(99, (lamports / GRADUATION_LAMPORTS) * 100);
  return 0;
}

function classify(progress: number, graduated: boolean): PulseToken["column"] {
  if (graduated || progress >= 100) return "migrated";
  if (progress >= 25) return "final";
  return "new";
}

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

function quoteTokenFromMint(mint?: string): string {
  if (mint === USDC_MINT) return "USDC";
  if (mint === USDT_MINT) return "USDT";
  return "SOL";
}

function normalizeProtocol(raw?: string): string {
  if (!raw) return "pump";
  return raw.toLowerCase().replace(/\.fun$/, "").trim();
}

function caEndsInPump(mint: string) {
  const lower = mint.toLowerCase();
  return lower.endsWith("pump") || lower.endsWith("bonk");
}

function auditFromV3(coin: PumpV3Coin, v2?: PumpV2Coin) {
  const graduated = Boolean(coin.complete || coin.pump_swap_pool || coin.raydium_pool);
  return {
    dexPaid: graduated,
    caEndsInPump: caEndsInPump(coin.mint),
    recentVisitors: v2?.transactions ?? coin.reply_count ?? 0,
    top10HoldersPct: v2?.topHoldersPercentage,
    devHoldingPct: v2?.devHoldingsPercentage,
    snipersPct: v2?.sniperOwnedPercentage,
    insidersPct: undefined as number | undefined,
    bundlePct: undefined as number | undefined,
    holders: v2?.numHolders,
    proTraders: v2?.numKolsTraded,
    devMigrations: graduated ? 1 : 0,
    devPairsCreated: undefined as number | undefined,
  };
}

function auditFromV2(coin: PumpV2Coin) {
  const graduated = Boolean(coin.graduationDate) || (coin.bondingCurveProgress ?? 0) >= 100;
  return {
    dexPaid: graduated,
    caEndsInPump: caEndsInPump(coin.coinMint),
    recentVisitors: coin.transactions ?? 0,
    top10HoldersPct: coin.topHoldersPercentage,
    devHoldingPct: coin.devHoldingsPercentage,
    snipersPct: coin.sniperOwnedPercentage,
    insidersPct: undefined as number | undefined,
    bundlePct: undefined as number | undefined,
    holders: coin.numHolders,
    proTraders: coin.numKolsTraded,
    devMigrations: graduated ? 1 : 0,
    devPairsCreated: undefined as number | undefined,
  };
}

function mapV3Coin(coin: PumpV3Coin, extra?: Partial<PulseToken>, v2?: PumpV2Coin): PulseToken | null {
  if (!coin.mint || !coin.symbol) return null;
  const createdAt = coin.created_timestamp;
  const ageMs = createdAt ? Date.now() - createdAt : 0;
  const progress = bondingProgress(coin);
  const graduated = Boolean(coin.complete || coin.pump_swap_pool || coin.raydium_pool);
  const mcap = coin.usd_market_cap ?? (coin.market_cap ? coin.market_cap * 140 : 0);
  const reserves = coin.real_quote_reserves ?? coin.real_sol_reserves ?? 0;
  const creator = creatorLine(coin, v2);

  return {
    id: `sol-${coin.mint}`,
    symbol: coin.symbol,
    name: coin.name ?? coin.symbol,
    address: coin.mint,
    addressSlug: addressSlug(coin.mint),
    mcap,
    volume: extra?.volume ?? v2?.volume ?? 0,
    age: createdAt ? formatPulseAge(ageMs) : "—",
    ageMs,
    createdAt,
    txCount: extra?.txCount ?? v2?.transactions ?? coin.reply_count ?? 0,
    buyTx: extra?.buyTx ?? v2?.buyTransactions,
    sellTx: extra?.sellTx ?? v2?.sellTransactions,
    bondingProgress: progress,
    column: classify(progress, graduated),
    protocol: normalizeProtocol(coin.protocol),
    quoteToken: quoteTokenFromMint(coin.quote_mint),
    priceUsd: mcap > 0 && coin.total_supply ? mcap / (coin.total_supply / 1e6) : 0,
    pairUrl: `https://pump.fun/coin/${coin.mint}`,
    imageUri: coin.image_uri,
    isLive: coin.is_currently_live,
    hasTwitter: Boolean(coin.twitter?.trim() || v2?.twitter?.trim()),
    hasTelegram: Boolean(coin.telegram?.trim()),
    hasWebsite: Boolean(coin.website?.trim()),
    twitterUrl: v2?.twitter ?? coin.twitter,
    creatorHandle: creator.creatorHandle,
    creatorMetric: creator.creatorMetric,
    feePct: coin.is_cashback_enabled ? 0 : 0,
    solLiquidity: solFromLamports(reserves),
    sniperCount: extra?.sniperCount ?? v2?.sniperCount,
    ...auditFromV3(coin, v2),
    ...extra,
  };
}

function mapV2Coin(coin: PumpV2Coin): PulseToken | null {
  if (!coin.coinMint || !coin.ticker) return null;
  const createdAt = coin.creationTime;
  const ageMs = createdAt ? Date.now() - createdAt : 0;
  const progress = bondingProgress(coin);
  const graduated = Boolean(coin.graduationDate) || progress >= 100;
  const handle = twitterHandle(coin.twitter) ?? (coin.dev ? `${coin.dev.slice(0, 4)}…${coin.dev.slice(-4)}` : undefined);

  return {
    id: `sol-${coin.coinMint}`,
    symbol: coin.ticker,
    name: coin.name ?? coin.ticker,
    address: coin.coinMint,
    addressSlug: addressSlug(coin.coinMint),
    mcap: coin.marketCap ?? 0,
    volume: coin.volume ?? 0,
    age: createdAt ? formatPulseAge(ageMs) : "—",
    ageMs,
    createdAt,
    txCount: coin.transactions ?? 0,
    buyTx: coin.buyTransactions,
    sellTx: coin.sellTransactions,
    bondingProgress: progress,
    column: classify(progress, graduated),
    protocol: normalizeProtocol(coin.platform ?? coin.program),
    quoteToken: "SOL",
    priceUsd: 0,
    pairUrl: `https://pump.fun/coin/${coin.coinMint}`,
    imageUri: coin.imageUrl,
    hasTwitter: Boolean(coin.twitter?.trim()),
    twitterUrl: coin.twitter,
    creatorHandle: handle,
    creatorMetric: coin.twitterReuseCount != null
      ? `${coin.twitterReuseCount} reuse`
      : coin.numHolders != null
        ? `${coin.numHolders} holders`
        : undefined,
    feePct: 0,
    solLiquidity: 0,
    sniperCount: coin.sniperCount,
    ...auditFromV2(coin),
  };
}

async function fetchPump<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: PUMP_HEADERS, cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();

    const [latest, graduated, live] = await Promise.all([
      fetchPump<PumpV3Coin[]>(
        "https://frontend-api-v3.pump.fun/coins?limit=60&offset=0&includeNsfw=false&sort=created_timestamp&order=DESC",
      ),
      fetchPump<{ coins: PumpV2Coin[] }>("https://advanced-api-v2.pump.fun/coins/graduated"),
      fetchPump<PumpV3Coin[]>("https://frontend-api-v3.pump.fun/coins/currently-live?limit=20"),
    ]);

    const v2ByMint = new Map<string, PumpV2Coin>();
    for (const c of graduated?.coins ?? []) {
      v2ByMint.set(c.coinMint, c);
    }

    const byId = new Map<string, PulseToken>();

    for (const coin of latest ?? []) {
      const v2 = v2ByMint.get(coin.mint);
      const mapped = mapV3Coin(coin, undefined, v2);
      if (!mapped) continue;
      if (!search || mapped.symbol.toLowerCase().includes(search) || mapped.name.toLowerCase().includes(search) || mapped.address.toLowerCase().includes(search)) {
        byId.set(mapped.id, mapped);
      }
    }

    for (const coin of graduated?.coins ?? []) {
      const mapped = mapV2Coin(coin);
      if (!mapped) continue;
      mapped.column = "migrated";
      mapped.bondingProgress = 100;
      if (!search || mapped.symbol.toLowerCase().includes(search) || mapped.name.toLowerCase().includes(search)) {
        byId.set(mapped.id, mapped);
      }
    }

    for (const coin of live ?? []) {
      const mapped = mapV3Coin(coin);
      if (!mapped) continue;
      mapped.isLive = true;
      if (!search || mapped.symbol.toLowerCase().includes(search) || mapped.name.toLowerCase().includes(search)) {
        const existing = byId.get(mapped.id);
        byId.set(mapped.id, existing ? { ...existing, isLive: true } : mapped);
      }
    }

    const tokens = [...byId.values()].sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return b.mcap - a.mcap;
    });

    return NextResponse.json({ tokens, source: "pump.fun", updatedAt: Date.now() });
  } catch (err) {
    console.error("Pulse API error:", err);
    return NextResponse.json({ error: "Failed to fetch pump.fun coins" }, { status: 500 });
  }
}