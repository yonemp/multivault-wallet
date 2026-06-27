export type PulseSummary = {
  newCount: number;
  finalCount: number;
  migratedCount: number;
  totalVolume: number;
  topMovers: Array<{
    symbol: string;
    name: string;
    mcap: number;
    volume: number;
    column: string;
    bondingProgress: number;
  }>;
};

export type MarketSnapshot = {
  sol: { price: number; change24h: number } | null;
  pulse: PulseSummary | null;
  fetchedAt: string;
};

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const [pricesRes, pulseRes] = await Promise.all([
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true", {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    }).catch(() => null),
    fetch("https://frontend-api-v3.pump.fun/coins?offset=0&limit=48&sort=created_timestamp&order=DESC&includeNsfw=false", {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    }).catch(() => null),
  ]);

  let sol: MarketSnapshot["sol"] = null;
  if (pricesRes?.ok) {
    const data = (await pricesRes.json()) as {
      solana?: { usd?: number; usd_24h_change?: number };
    };
    if (data.solana?.usd != null) {
      sol = {
        price: data.solana.usd,
        change24h: data.solana.usd_24h_change ?? 0,
      };
    }
  }

  let pulse: PulseSummary | null = null;
  if (pulseRes?.ok) {
    const coins = (await pulseRes.json()) as Array<{
      symbol?: string;
      name?: string;
      usd_market_cap?: number;
      market_cap?: number;
      complete?: boolean;
      virtual_sol_reserves?: number;
      real_sol_reserves?: number;
    }>;

    const mapped = coins.map((c) => {
      const mcap = c.usd_market_cap ?? c.market_cap ?? 0;
      const reserves = c.real_sol_reserves ?? c.virtual_sol_reserves ?? 0;
      const bondingProgress = c.complete ? 100 : Math.min(99, (reserves / 85_000_000_000) * 100);
      const column = c.complete ? "migrated" : bondingProgress >= 80 ? "final" : "new";
      return {
        symbol: c.symbol ?? "???",
        name: c.name ?? "Unknown",
        mcap,
        volume: mcap * 0.15,
        column,
        bondingProgress,
      };
    });

    pulse = {
      newCount: mapped.filter((t) => t.column === "new").length,
      finalCount: mapped.filter((t) => t.column === "final").length,
      migratedCount: mapped.filter((t) => t.column === "migrated").length,
      totalVolume: mapped.reduce((s, t) => s + t.volume, 0),
      topMovers: mapped
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 6),
    };
  }

  return { sol, pulse, fetchedAt: new Date().toISOString() };
}

export function formatSnapshotForPrompt(snapshot: MarketSnapshot): string {
  const lines: string[] = [`Market snapshot (${snapshot.fetchedAt}):`];

  if (snapshot.sol) {
    lines.push(
      `- SOL: $${snapshot.sol.price.toFixed(2)} (${snapshot.sol.change24h >= 0 ? "+" : ""}${snapshot.sol.change24h.toFixed(2)}% 24h)`,
    );
  }

  if (snapshot.pulse) {
    const p = snapshot.pulse;
    lines.push(
      `- Pulse: ${p.newCount} new, ${p.finalCount} final stretch, ${p.migratedCount} migrated tokens in recent feed`,
      `- Est. memecoin volume (sample): $${(p.totalVolume / 1_000_000).toFixed(2)}M`,
    );
    if (p.topMovers.length) {
      lines.push(
        `- Top movers: ${p.topMovers.map((t) => `${t.symbol} (${t.column}, $${(t.mcap / 1000).toFixed(0)}k mcap)`).join(", ")}`,
      );
    }
  }

  return lines.join("\n");
}