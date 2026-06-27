"use client";

import { useEffect, useMemo, useState } from "react";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { PageHeader } from "@/components/ui/PageHeader";
import type { AssetMarketData } from "@/app/api/prices/route";
import { MARKET_ASSETS } from "@/lib/market/assets";
import { DashboardTab } from "./ActionTabs.types";
type DiscoverPanelProps = {
  onNavigate: (tab: DashboardTab, asset?: string) => void;
};

type SortKey = "volume" | "volatility" | "change";

export function DiscoverPanel({ onNavigate }: DiscoverPanelProps) {
  const [market, setMarket] = useState<Record<string, AssetMarketData>>({});
  const [sort, setSort] = useState<SortKey>("volume");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => setMarket(d.assets ?? {}))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    return MARKET_ASSETS.filter((a) => a.tradable && market[a.id])
      .map((asset, i) => {
        const m = market[asset.id];
        const volatility = Math.abs(m.change4h) + Math.abs(m.change24h) * 0.3;
        const volume = m.price * (1e6 + i * 2e5);
        return { asset, m, volatility, volume };
      })
      .sort((a, b) => {
        if (sort === "volume") return b.volume - a.volume;
        if (sort === "volatility") return b.volatility - a.volatility;
        return b.m.change24h - a.m.change24h;
      });
  }, [market, sort]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Discover"
        description="Rank tokens by volume, volatility, and movement — filter high-potential plays"
        action={
          <div className="flex gap-1">
            {(["volume", "volatility", "change"] as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSort(k)}
                className={`px-2 py-1 text-[10px] font-semibold uppercase ${
                  sort === k
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        }
      />

      <div className="mv-panel flex-1 overflow-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)] text-[10px] uppercase tracking-wider text-[var(--muted)]">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Token</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">24h</th>
              <th className="px-3 py-2 text-right">Volatility</th>
              <th className="px-3 py-2 text-center">Chart</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="h-12 animate-pulse border-b border-[var(--border)] bg-[var(--surface-hover)]" />
                ))
              : rows.map(({ asset, m, volatility }, i) => (
                  <tr key={asset.id} className="ax-table-row">
                    <td className="px-3 py-2.5 font-mono text-[var(--muted)]">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <button type="button" onClick={() => onNavigate("trade", asset.id)} className="font-semibold hover:text-[var(--primary)]">
                        {asset.symbol}
                      </button>
                      <span className="ml-2 text-[var(--muted)]">{asset.name}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">${m.price.toFixed(m.price > 100 ? 2 : 4)}</td>
                    <td className={`px-3 py-2.5 text-right font-mono font-semibold ${m.change24h >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                      {m.change24h >= 0 ? "+" : ""}{m.change24h.toFixed(2)}%
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{volatility.toFixed(1)}%</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center">
                        <MiniSparkline data={m.sparkline24h} positive={m.change24h >= 0} width={64} height={24} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button type="button" onClick={() => onNavigate("trade", asset.id)} className="text-[10px] font-semibold uppercase text-[var(--primary)]">
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}