"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { MARKET_ASSETS } from "@/lib/market/assets";
import type { AssetMarketData } from "@/app/api/prices/route";
import { safeFixed, safeNumber } from "@/lib/format/numbers";
import { DashboardTab } from "./ActionTabs.types";

type SimilarTokensPanelProps = {
  seedAsset?: string;
  onNavigate: (tab: DashboardTab, asset?: string) => void;
};

export function SimilarTokensPanel({
  seedAsset = "sol",
  onNavigate,
}: SimilarTokensPanelProps) {
  const [market, setMarket] = useState<Record<string, AssetMarketData>>({});
  const [selected, setSelected] = useState(seedAsset);

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => setMarket(d.assets ?? {}));
  }, []);

  const seed = MARKET_ASSETS.find((a) => a.id === selected);
  const similar = MARKET_ASSETS.filter(
    (a) => a.tradable && a.id !== selected && market[a.id],
  ).slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Similar Tokens"
        description="Surface related plays based on a token you're watching"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {MARKET_ASSETS.filter((a) => a.tradable).map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a.id)}
            className={`border px-3 py-1.5 text-xs font-semibold ${
              selected === a.id
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                : "border-[var(--border)] text-[var(--muted)]"
            }`}
          >
            {a.symbol}
          </button>
        ))}
      </div>

      <p className="mb-3 text-sm text-[var(--muted)]">
        Tokens similar to <strong className="text-[var(--foreground)]">{seed?.symbol ?? selected}</strong>
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {similar.map((a) => {
          const m = market[a.id];
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onNavigate("trade", a.id)}
              className="mv-panel p-4 text-left transition hover:border-[var(--primary)]"
            >
              <p className="font-semibold">{a.symbol}</p>
              <p className="text-xs text-[var(--muted)]">{a.name}</p>
              <p className="mt-2 font-mono text-sm">${safeFixed(m?.price, 2)}</p>
              <p className={`text-xs font-mono ${safeNumber(m?.change24h) >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                {safeNumber(m?.change24h) >= 0 ? "+" : ""}{safeFixed(m?.change24h, 2)}% 24h
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}