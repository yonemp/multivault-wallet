"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetMarketData } from "@/app/api/prices/route";
import { DashboardTab } from "@/components/dashboard/ActionTabs.types";
import {
  buildMemeTokens,
  formatCompactUsd,
  MemeToken,
  Protocol,
  PulseColumn,
  PULSE_FILTER_LABELS,
} from "@/lib/platform/mock-tokens";
import { ChevronDown, Filter, Search, Zap } from "lucide-react";

const TIME_FILTERS = ["1m", "5m", "30m", "1h", "3h", "6h", "12h", "24h", "3d"] as const;

const COLUMNS: { key: PulseColumn; title: string }[] = [
  { key: "new", title: "New Pairs" },
  { key: "final", title: "Final Stretch" },
  { key: "migrated", title: "Migrated" },
];

const PROTOCOLS: Protocol[] = ["pump.fun", "raydium", "meteora", "moonshot"];

export type ColumnFilters = {
  protocol: Protocol | "all";
  mcapMin: number;
  volMin: number;
  devMax: number;
  bundlersMax: number;
  snipersMax: number;
  insidersMax: number;
  newWalletsMin: number;
};

const DEFAULT_FILTERS: ColumnFilters = {
  protocol: "all",
  mcapMin: 0,
  volMin: 0,
  devMax: 100,
  bundlersMax: 999,
  snipersMax: 999,
  insidersMax: 999,
  newWalletsMin: 0,
};

type PulsePanelProps = {
  onNavigate: (tab: DashboardTab, asset?: string) => void;
};

function applyFilters(tokens: MemeToken[], f: ColumnFilters, search: string) {
  const q = search.trim().toLowerCase();
  return tokens.filter((t) => {
    if (q && !t.symbol.toLowerCase().includes(q) && !t.name.toLowerCase().includes(q)) return false;
    if (f.protocol !== "all" && t.protocol !== f.protocol) return false;
    if (t.mcap < f.mcapMin) return false;
    if (t.volume < f.volMin) return false;
    if (t.devHolding > f.devMax) return false;
    if (t.bundlers > f.bundlersMax) return false;
    if (t.snipers > f.snipersMax) return false;
    if (t.insiders > f.insidersMax) return false;
    if (t.newWallets < f.newWalletsMin) return false;
    return true;
  });
}

function ColumnFilterBar({
  filters,
  onChange,
}: {
  filters: ColumnFilters;
  onChange: (f: ColumnFilters) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 text-[9px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <Filter className="h-3 w-3" />
        Filters
        <ChevronDown className={`ml-auto h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-1.5 space-y-1.5 pb-1">
          <div>
            <label className="text-[8px] uppercase text-[var(--muted-dim)]">{PULSE_FILTER_LABELS.protocol}</label>
            <select
              value={filters.protocol}
              onChange={(e) => onChange({ ...filters, protocol: e.target.value as ColumnFilters["protocol"] })}
              className="mv-input mt-0.5 !py-1 text-[9px]"
            >
              <option value="all">All</option>
              {PROTOCOLS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div>
              <label className="text-[8px] uppercase text-[var(--muted-dim)]">{PULSE_FILTER_LABELS.mcap} min</label>
              <input
                type="number"
                value={filters.mcapMin || ""}
                onChange={(e) => onChange({ ...filters, mcapMin: Number(e.target.value) || 0 })}
                placeholder="0"
                className="mv-input mt-0.5 !py-1 text-[9px]"
              />
            </div>
            <div>
              <label className="text-[8px] uppercase text-[var(--muted-dim)]">{PULSE_FILTER_LABELS.volume} min</label>
              <input
                type="number"
                value={filters.volMin || ""}
                onChange={(e) => onChange({ ...filters, volMin: Number(e.target.value) || 0 })}
                placeholder="0"
                className="mv-input mt-0.5 !py-1 text-[9px]"
              />
            </div>
            <div>
              <label className="text-[8px] uppercase text-[var(--muted-dim)]">{PULSE_FILTER_LABELS.devHolding} max%</label>
              <input
                type="number"
                value={filters.devMax}
                onChange={(e) => onChange({ ...filters, devMax: Number(e.target.value) || 100 })}
                className="mv-input mt-0.5 !py-1 text-[9px]"
              />
            </div>
            <div>
              <label className="text-[8px] uppercase text-[var(--muted-dim)]">{PULSE_FILTER_LABELS.bundlers} max</label>
              <input
                type="number"
                value={filters.bundlersMax}
                onChange={(e) => onChange({ ...filters, bundlersMax: Number(e.target.value) || 999 })}
                className="mv-input mt-0.5 !py-1 text-[9px]"
              />
            </div>
            <div>
              <label className="text-[8px] uppercase text-[var(--muted-dim)]">{PULSE_FILTER_LABELS.snipers} max</label>
              <input
                type="number"
                value={filters.snipersMax}
                onChange={(e) => onChange({ ...filters, snipersMax: Number(e.target.value) || 999 })}
                className="mv-input mt-0.5 !py-1 text-[9px]"
              />
            </div>
            <div>
              <label className="text-[8px] uppercase text-[var(--muted-dim)]">{PULSE_FILTER_LABELS.insiders} max</label>
              <input
                type="number"
                value={filters.insidersMax}
                onChange={(e) => onChange({ ...filters, insidersMax: Number(e.target.value) || 999 })}
                className="mv-input mt-0.5 !py-1 text-[9px]"
              />
            </div>
          </div>
          <div>
            <label className="text-[8px] uppercase text-[var(--muted-dim)]">{PULSE_FILTER_LABELS.newWallets} min</label>
            <input
              type="number"
              value={filters.newWalletsMin || ""}
              onChange={(e) => onChange({ ...filters, newWalletsMin: Number(e.target.value) || 0 })}
              placeholder="0"
              className="mv-input mt-0.5 !py-1 text-[9px]"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="w-full py-0.5 text-[8px] text-[var(--primary)] hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

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
            <span className="truncate text-[9px] text-[var(--muted)]">{token.protocol}</span>
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
  const [columnFilters, setColumnFilters] = useState<Record<PulseColumn, ColumnFilters>>({
    new: { ...DEFAULT_FILTERS },
    final: { ...DEFAULT_FILTERS },
    migrated: { ...DEFAULT_FILTERS },
  });
  const [columnSearch, setColumnSearch] = useState<Record<PulseColumn, string>>({
    new: "",
    final: "",
    migrated: "",
  });

  useEffect(() => {
    fetch("/api/prices?assets=sol")
      .then((r) => r.json())
      .then((d: { assets?: Record<string, AssetMarketData> }) => {
        if (d.assets?.sol?.price) setSolPrice(d.assets.sol.price);
      })
      .catch(() => {});
  }, []);

  const tokens = useMemo(() => buildMemeTokens(solPrice), [solPrice]);

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
      </div>

      <div className="mv-panel grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-3">
        {COLUMNS.map(({ key, title }) => {
          const colTokens = applyFilters(
            tokens.filter((t) => t.column === key),
            columnFilters[key],
            columnSearch[key],
          );
          return (
            <div key={key} className="ax-pulse-col min-h-[300px] md:min-h-0">
              <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-solid)] px-2 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider">{title}</span>
                <span className="ml-auto font-mono text-[9px] text-[var(--muted)]">{colTokens.length}</span>
              </div>

              <ColumnFilterBar
                filters={columnFilters[key]}
                onChange={(f) => setColumnFilters((prev) => ({ ...prev, [key]: f }))}
              />

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
                  value={columnSearch[key]}
                  onChange={(e) => setColumnSearch((prev) => ({ ...prev, [key]: e.target.value }))}
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
                  <p className="px-3 py-6 text-center text-[10px] text-[var(--muted)]">No pairs match filters</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}