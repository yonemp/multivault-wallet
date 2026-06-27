"use client";

import { useEffect, useState } from "react";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import type { AssetMarketData } from "@/app/api/prices/route";
import { MARKET_ASSETS } from "@/lib/market/assets";
import { DashboardTab } from "@/components/dashboard/ActionTabs.types";
import { Filter, Zap } from "lucide-react";

type PulseToken = {
  id: string;
  symbol: string;
  name: string;
  mcap: string;
  liquidity: string;
  age: string;
  change: number;
  sparkline: { t: number; v: number }[];
  column: "new" | "final" | "migrated";
};

function formatMcap(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function buildPulseTokens(market: Record<string, AssetMarketData>): PulseToken[] {
  return MARKET_ASSETS.filter((a) => a.tradable && market[a.id]).map((asset, i) => {
    const m = market[asset.id];
    const price = m.price;
    const mcapNum = price * (asset.id === "btc" ? 19e6 : asset.id === "eth" ? 120e6 : 500e6);
    return {
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      mcap: formatMcap(mcapNum * (0.3 + (i % 5) * 0.15)),
      liquidity: formatMcap(mcapNum * 0.08),
      age: `${(i % 12) + 1}m`,
      change: m.change24h,
      sparkline: m.sparkline4h,
      column: (["new", "final", "migrated"] as const)[i % 3],
    };
  });
}

type PulsePanelProps = {
  onNavigate: (tab: DashboardTab, asset?: string) => void;
};

function TokenCard({
  token,
  onTrade,
}: {
  token: PulseToken;
  onTrade: () => void;
}) {
  const positive = token.change >= 0;

  return (
    <button
      type="button"
      onClick={onTrade}
      className="ax-table-row flex w-full items-center gap-2 px-3 py-2.5 text-left"
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center text-[10px] font-bold"
        style={{
          background: "var(--surface-active)",
          border: "1px solid var(--border)",
          color: "var(--primary)",
        }}
      >
        {token.symbol.slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-semibold text-[var(--foreground)]">
            {token.symbol}
          </span>
          <span className="truncate text-[10px] text-[var(--muted)]">{token.name}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] font-mono text-[var(--muted)]">
          <span>MC {token.mcap}</span>
          <span>·</span>
          <span>{token.age}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <MiniSparkline data={token.sparkline} positive={positive} width={56} height={22} />
        <span
          className={`font-mono text-[10px] font-semibold ${positive ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}
        >
          {positive ? "+" : ""}
          {token.change.toFixed(1)}%
        </span>
      </div>
    </button>
  );
}

export function PulsePanel({ onNavigate }: PulsePanelProps) {
  const [market, setMarket] = useState<Record<string, AssetMarketData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => setMarket(d.assets ?? {}))
      .finally(() => setLoading(false));
  }, []);

  const tokens = buildPulseTokens(market);
  const columns = [
    { key: "new" as const, title: "New Pairs", icon: Zap },
    { key: "final" as const, title: "Final Stretch", icon: Filter },
    { key: "migrated" as const, title: "Migrated", icon: Zap },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          <h1 className="text-base font-semibold text-[var(--foreground)]">Pulse</h1>
          <p className="text-[11px] text-[var(--muted)]">
            Live market discovery · click any pair to trade
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 text-[11px] font-medium text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
        >
          <Filter className="h-3 w-3" /> Filters
        </button>
      </div>

      <div className="mv-panel grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-3">
        {columns.map(({ key, title, icon: Icon }) => (
          <div key={key} className="ax-pulse-col min-h-[320px] md:min-h-0">
            <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2">
              <Icon className="h-3 w-3 text-[var(--primary)]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]">
                {title}
              </span>
              <span className="ml-auto font-mono text-[10px] text-[var(--muted)]">
                {tokens.filter((t) => t.column === key).length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-0">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse border-b border-[var(--border)] bg-[var(--surface-hover)]" />
                  ))}
                </div>
              ) : (
                tokens
                  .filter((t) => t.column === key)
                  .map((token) => (
                    <TokenCard
                      key={token.id}
                      token={token}
                      onTrade={() => onNavigate("trade", token.id)}
                    />
                  ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}