"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetMarketData } from "@/app/api/prices/route";
import { DashboardTab } from "@/components/dashboard/ActionTabs.types";
import {
  buildMemeTokens,
  formatCompactUsd,
  MemeToken,
  PulseColumn,
} from "@/lib/platform/mock-tokens";
import { ChevronDown, Search, Zap } from "lucide-react";

const TIME_FILTERS = ["1m", "5m", "30m", "1h", "3h", "6h", "12h", "24h", "3d"] as const;

const COLUMNS: { key: PulseColumn; title: string }[] = [
  { key: "new", title: "New Pairs" },
  { key: "final", title: "Final Stretch" },
  { key: "migrated", title: "Migrated" },
];

type PulsePanelProps = {
  onNavigate: (tab: DashboardTab, asset?: string) => void;
};

function PulseRow({
  token,
  onTrade,
  onQuickBuy,
}: {
  token: MemeToken;
  onTrade: () => void;
  onQuickBuy: () => void;
}) {
  const positive = token.change5m >= 0;

  return (
    <div className="ax-table-row group grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.6fr)_auto] items-center gap-1 px-2 py-1.5">
      <button type="button" onClick={onTrade} className="flex min-w-0 items-center gap-2 text-left">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center text-[9px] font-bold"
          style={{ background: "var(--surface-active)", border: "1px solid var(--border)", color: "var(--primary)" }}
        >
          {token.symbol.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[11px] font-semibold">{token.symbol}</span>
            <span className="truncate text-[9px] text-[var(--muted)]">{token.name}</span>
          </div>
          <span className="font-mono text-[9px] text-[var(--muted-dim)]">{token.age}</span>
        </div>
      </button>
      <span className="font-mono text-[10px] text-[var(--foreground)]">{formatCompactUsd(token.mcap)}</span>
      <span className="font-mono text-[10px] text-[var(--muted)]">{token.txCount}</span>
      <span className="font-mono text-[10px] text-[var(--muted)]">{token.holders}</span>
      <span className={`font-mono text-[10px] font-semibold ${positive ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
        {positive ? "+" : ""}
        {token.change5m.toFixed(1)}%
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onQuickBuy();
        }}
        className="shrink-0 bg-[var(--primary)] px-2 py-1 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100 hover:brightness-110"
      >
        +{token.quickBuySol} SOL
      </button>
    </div>
  );
}

export function PulsePanel({ onNavigate }: PulsePanelProps) {
  const [solPrice, setSolPrice] = useState(140);
  const [timeFilter, setTimeFilter] = useState<(typeof TIME_FILTERS)[number]>("5m");
  const [search, setSearch] = useState("");
  const [displayOpen, setDisplayOpen] = useState(false);

  useEffect(() => {
    fetch("/api/prices?assets=sol")
      .then((r) => r.json())
      .then((d: { assets?: Record<string, AssetMarketData> }) => {
        if (d.assets?.sol?.price) setSolPrice(d.assets.sol.price);
      })
      .catch(() => {});
  }, []);

  const tokens = useMemo(() => buildMemeTokens(solPrice), [solPrice]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter(
      (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
    );
  }, [tokens, search]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-[var(--primary)]" />
          <span className="text-sm font-semibold">Pulse</span>
          <span className="ax-live-dot h-1.5 w-1.5 rounded-full bg-[var(--gain)]" />
        </div>

        <div className="flex flex-wrap items-center gap-0.5">
          {TIME_FILTERS.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeFilter(tf)}
              className={`px-2 py-0.5 text-[10px] font-semibold ${
                timeFilter === tf
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setDisplayOpen((o) => !o)}
            className="flex items-center gap-1 border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] hover:border-[var(--border-strong)]"
          >
            Display <ChevronDown className="h-3 w-3" />
          </button>
          {displayOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] border border-[var(--border-strong)] bg-[var(--surface-solid)] py-1 text-[10px] shadow-[var(--shadow-md)]">
              {["MC", "TX", "Holders", "Age", "5m %"].map((col) => (
                <label key={col} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-[var(--surface-hover)]">
                  <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
                  {col}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mv-panel grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-3">
        {COLUMNS.map(({ key, title }) => {
          const colTokens = filtered.filter((t) => t.column === key);
          return (
            <div key={key} className="ax-pulse-col min-h-[300px] md:min-h-0">
              <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-solid)] px-2 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider">{title}</span>
                <span className="ml-auto font-mono text-[9px] text-[var(--muted)]">{colTokens.length}</span>
              </div>

              <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.6fr)_auto] gap-1 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-[var(--muted-dim)]">
                <span>Token</span>
                <span>MC</span>
                <span>TX</span>
                <span>Holders</span>
                <span>5m</span>
                <span />
              </div>

              <div className="relative border-b border-[var(--border)] px-2 py-1">
                <Search className="absolute left-4 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--muted-dim)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-transparent py-1 pl-6 text-[10px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-dim)]"
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {colTokens.map((token) => (
                  <PulseRow
                    key={token.id}
                    token={token}
                    onTrade={() => onNavigate("trade", token.id)}
                    onQuickBuy={() => onNavigate("trade", token.id)}
                  />
                ))}
                {colTokens.length === 0 && (
                  <p className="px-3 py-6 text-center text-[10px] text-[var(--muted)]">No pairs match filter</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}