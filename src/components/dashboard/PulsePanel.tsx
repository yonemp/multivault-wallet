"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PulseToken } from "@/app/api/pulse/route";
import { DashboardTab } from "@/components/dashboard/ActionTabs.types";
import { formatCompactUsd } from "@/lib/format/numbers";
import { ChevronDown, Filter, RefreshCw, Search, Zap } from "lucide-react";

const COLUMNS: { key: PulseToken["column"]; title: string }[] = [
  { key: "new", title: "New Pairs" },
  { key: "final", title: "Final Stretch" },
  { key: "migrated", title: "Migrated" },
];

export type ColumnFilters = {
  mcapMin: number;
  volMin: number;
};

const DEFAULT_FILTERS: ColumnFilters = {
  mcapMin: 0,
  volMin: 0,
};

type PulsePanelProps = {
  onNavigate: (tab: DashboardTab, asset?: string) => void;
};

function applyFilters(tokens: PulseToken[], f: ColumnFilters, search: string) {
  const q = search.trim().toLowerCase();
  return tokens.filter((t) => {
    if (q && !t.symbol.toLowerCase().includes(q) && !t.name.toLowerCase().includes(q) && !t.address.toLowerCase().includes(q)) return false;
    if (t.mcap < f.mcapMin) return false;
    if (t.volume < f.volMin) return false;
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
          <div className="grid grid-cols-2 gap-1">
            <div>
              <label className="text-[8px] uppercase text-[var(--muted-dim)]">MC min ($)</label>
              <input
                type="number"
                value={filters.mcapMin || ""}
                onChange={(e) => onChange({ ...filters, mcapMin: Number(e.target.value) || 0 })}
                placeholder="0"
                className="mv-input mt-0.5 !py-1 text-[9px]"
              />
            </div>
            <div>
              <label className="text-[8px] uppercase text-[var(--muted-dim)]">Vol min ($)</label>
              <input
                type="number"
                value={filters.volMin || ""}
                onChange={(e) => onChange({ ...filters, volMin: Number(e.target.value) || 0 })}
                placeholder="0"
                className="mv-input mt-0.5 !py-1 text-[9px]"
              />
            </div>
          </div>
          <button type="button" onClick={() => onChange(DEFAULT_FILTERS)} className="w-full py-0.5 text-[8px] text-[var(--primary)] hover:underline">
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

function PulseRow({ token, onTrade }: { token: PulseToken; onTrade: () => void }) {
  return (
    <div className="ax-table-row group grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.6fr)_auto] items-center gap-1 px-2 py-1.5">
      <button type="button" onClick={onTrade} className="flex min-w-0 items-center gap-2 text-left">
        {token.imageUri ? (
          <img src={token.imageUri} alt="" className="h-7 w-7 shrink-0 border border-[var(--border)] object-cover" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center text-[9px] font-bold" style={{ background: "var(--surface-active)", border: "1px solid var(--border)", color: "var(--primary)" }}>
            {token.symbol.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[11px] font-semibold">{token.symbol}</span>
            {token.isLive && <span className="rounded bg-[var(--loss)]/20 px-1 text-[8px] font-bold text-[var(--loss)]">LIVE</span>}
            <span className="truncate text-[9px] text-[var(--muted)]">pump.fun</span>
          </div>
          <span className="font-mono text-[9px] text-[var(--muted-dim)]">{token.age}</span>
        </div>
      </button>
      <span className="font-mono text-[10px] text-[var(--foreground)]">{formatCompactUsd(token.mcap)}</span>
      <span className="font-mono text-[10px] text-[var(--muted)]">{token.txCount}</span>
      <span className="font-mono text-[10px] text-[var(--muted)]">{formatCompactUsd(token.volume)}</span>
      <span className="font-mono text-[10px] font-semibold text-[var(--primary)]">
        {token.bondingProgress.toFixed(0)}%
      </span>
      <a
        href={token.pairUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 bg-[var(--primary)] px-2 py-1 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100"
      >
        Pump
      </a>
    </div>
  );
}

export function PulsePanel({ onNavigate }: PulsePanelProps) {
  const [tokens, setTokens] = useState<PulseToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<PulseToken["column"], ColumnFilters>>({
    new: { ...DEFAULT_FILTERS },
    final: { ...DEFAULT_FILTERS },
    migrated: { ...DEFAULT_FILTERS },
  });
  const [columnSearch, setColumnSearch] = useState<Record<PulseToken["column"], string>>({
    new: "",
    final: "",
    migrated: "",
  });

  const loadPulse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pulse");
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { tokens: PulseToken[]; updatedAt?: number };
      setTokens(data.tokens ?? []);
      setUpdatedAt(data.updatedAt ?? Date.now());
    } catch {
      setError("Could not load live coins from pump.fun");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPulse();
    const interval = setInterval(loadPulse, 30_000);
    return () => clearInterval(interval);
  }, [loadPulse]);

  const counts = useMemo(() => ({
    new: tokens.filter((t) => t.column === "new").length,
    final: tokens.filter((t) => t.column === "final").length,
    migrated: tokens.filter((t) => t.column === "migrated").length,
  }), [tokens]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-[var(--primary)]" />
          <span className="text-sm font-semibold">Pulse</span>
          <span className="ax-live-dot h-1.5 w-1.5 rounded-full bg-[var(--gain)]" />
          <span className="text-[9px] text-[var(--muted)]">pump.fun live · {tokens.length} coins</span>
        </div>
        <button type="button" onClick={loadPulse} disabled={loading} className="ml-auto flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--primary)]">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {updatedAt ? new Date(updatedAt).toLocaleTimeString() : "—"}
        </button>
      </div>

      {error && <p className="mv-alert-error mb-2 text-xs">{error}</p>}

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
                <span className="ml-auto font-mono text-[9px] text-[var(--muted)]">{colTokens.length}/{counts[key]}</span>
              </div>
              <ColumnFilterBar filters={columnFilters[key]} onChange={(f) => setColumnFilters((prev) => ({ ...prev, [key]: f }))} />
              <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.6fr)_auto] gap-1 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-[var(--muted-dim)]">
                <span>Token</span>
                <span>MC</span>
                <span>TX</span>
                <span>Vol</span>
                <span>Curve</span>
                <span />
              </div>
              <div className="relative border-b border-[var(--border)] px-2 py-1">
                <Search className="absolute left-4 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--muted-dim)]" />
                <input value={columnSearch[key]} onChange={(e) => setColumnSearch((prev) => ({ ...prev, [key]: e.target.value }))} placeholder="Search..." className="w-full bg-transparent py-1 pl-6 text-[10px] outline-none" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading && !colTokens.length ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse border-b border-[var(--border)] bg-[var(--surface-hover)]" />
                  ))
                ) : (
                  colTokens.map((token) => (
                    <PulseRow key={token.id} token={token} onTrade={() => onNavigate("trade", token.id)} />
                  ))
                )}
                {!loading && colTokens.length === 0 && tokens.length > 0 && (
                  <p className="px-3 py-6 text-center text-[10px] text-[var(--muted)]">No coins in this column match filters</p>
                )}
                {!loading && tokens.length === 0 && (
                  <p className="px-3 py-6 text-center text-[10px] text-[var(--muted)]">No live pump.fun coins — try Refresh</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}