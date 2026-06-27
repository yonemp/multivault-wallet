import { NextRequest, NextResponse } from "next/server";
import { MARKET_ASSETS } from "@/lib/market/assets";

export type PricePoint = { t: number; v: number };

export type AssetMarketData = {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
  change4h: number;
  sparkline24h: PricePoint[];
  sparkline4h: PricePoint[];
};

async function fetchCoinGecko(ids: string[]) {
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("sparkline", "true");
  url.searchParams.set("price_change_percentage", "24h");

  const res = await fetch(url.toString(), {
    next: { revalidate: 120 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`CoinGecko error: ${res.status}`);
  }

  return (await res.json()) as Array<{
    id: string;
    symbol: string;
    current_price: number;
    price_change_percentage_24h: number;
    sparkline_in_7d?: { price: number[] };
  }>;
}

function toSparkline(prices: number[], hours: number): PricePoint[] {
  const points = Math.min(prices.length, hours * 12);
  const slice = prices.slice(-points);
  const now = Date.now();
  const interval = (hours * 3600 * 1000) / Math.max(slice.length - 1, 1);

  return slice.map((v, i) => ({
    t: now - (slice.length - 1 - i) * interval,
    v,
  }));
}

export async function GET(req: NextRequest) {
  try {
    const assetParam = req.nextUrl.searchParams.get("assets");
    const assets = assetParam
      ? assetParam.split(",").map((s) => s.trim())
      : MARKET_ASSETS.map((a) => a.id);

    const cgIds = assets
      .map((id) => MARKET_ASSETS.find((a) => a.id === id)?.coingeckoId)
      .filter(Boolean) as string[];

    if (!cgIds.length) {
      return NextResponse.json({ assets: {} });
    }

    const data = await fetchCoinGecko(cgIds);
    const byCgId = new Map(data.map((d) => [d.id, d]));
    const result: Record<string, AssetMarketData> = {};

    for (const assetId of assets) {
      const meta = MARKET_ASSETS.find((a) => a.id === assetId);
      if (!meta?.coingeckoId) continue;

      const coin = byCgId.get(meta.coingeckoId);
      if (!coin) continue;

      const prices = coin.sparkline_in_7d?.price ?? [];
      const last24 = prices.slice(-24);
      const change4h =
        last24.length >= 2
          ? ((last24[last24.length - 1] - last24[Math.max(0, last24.length - 5)]) /
              last24[Math.max(0, last24.length - 5)]) *
            100
          : 0;

      result[assetId] = {
        id: assetId,
        symbol: meta.symbol,
        price: coin.current_price ?? 0,
        change24h: coin.price_change_percentage_24h ?? 0,
        change4h,
        sparkline24h: toSparkline(prices, 24),
        sparkline4h: toSparkline(prices, 4),
      };
    }

    return NextResponse.json({ assets: result });
  } catch (err) {
    console.error("Prices API error:", err);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}