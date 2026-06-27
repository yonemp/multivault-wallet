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

const ROW_GRID =
  "grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_auto] items-center gap-3";

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
    <div className="border-b border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <Filter className="h-3.5 w-3.5" />
        Filters
        <ChevronDown className={`ml-auto h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-2 pb-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-dim)]">MC min ($)</label>
              <input
                type="number"
                value={filters.mcapMin || ""}
                onChange={(e) => onChange({ ...filters, mcapMin: Number(e.target.value) || 0 })}
                placeholder="0"
                className="mv-input mt-1 !py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-dim)]">Vol min ($)</label>
              <input
                type="number"
                value={filters.volMin || ""}
                onChange={(e) => onChange({ ...filters, volMin: Number(e.target.value) || 0 })}
                placeholder="0"
                className="mv-input mt-1 !py-2 text-sm"
              />
            </div>
          </div>
          <button type="button" onClick={() => onChange(DEFAULT_FILTERS)} className="text-xs font-medium text-[var(--primary)] hover:underline">
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

function PulseRow({ token, onTrade }: { token: PulseToken; onTrade: () => void }) {
  return (
    <div className={`ax-pulse-row group ${ROW_GRID} px-4 py-3`}>
      <button type="button" onClick={onTrade} className="flex min-w-0 items-center gap-3 text-left">
        {token.imageUri ? (
          <img
            src={token.imageUri}
            alt=""
            className="h-10 w-10 shrink-0 rounded-sm border-2 border-[var(--border-strong)] object-cover"
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 border-[var(--border-strong)] text-xs font-bold"
            style={{ background: "var(--surface-active)", color: "var(--primary)" }}
          >
            {token.symbol.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">{token.symbol}</span>
            {token.isLive && (
              <span className="rounded border border-[var(--loss)]/40 bg-[var(--loss)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--loss)]">
                LIVE
              </span>
            )}
            <span className="truncate text-xs text-[var(--muted)]">pump.fun</span>
          </div>
          <span className="font-mono text-xs text-[var(--muted-dim)]">{token.age}</span>
        </div>
      </button>
      <span className="font-mono text-sm font-medium text-[var(--foreground)]">{formatCompactUsd(token.mcap)}</span>
      <span className="font-mono text-sm text-[var(--muted)]">{formatCompactUsd(token.volume)}</span>
      <a
        href={token.pairUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 rounded-sm border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-xs font-bold text-white opacity-100 transition hover:brightness-110 md:opacity-0 md:group-hover:opacity-100"
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-[var(--border-strong)] pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[var(--primary)]" />
          <span className="text-base font-semibold">Pulse</span>
          <span className="ax-live-dot h-2 w-2 rounded-full bg-[var(--gain)]" />
          <span className="text-xs text-[var(--muted)]">pump.fun live · {tokens.length} coins</span>
        </div>
        <button
          type="button"
          onClick={loadPulse}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 rounded-sm border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {updatedAt ? new Date(updatedAt).toLocaleTimeString() : "—"}
        </button>
      </div>

      {error && <p className="mv-alert-error mb-3 text-sm">{error}</p>}

      <div className="ax-pulse-grid min-h-0 flex-1 overflow-hidden">
        {COLUMNS.map(({ key, title }, index) => {
          const colTokens = applyFilters(
            tokens.filter((t) => t.column === key),
            columnFilters[key],
            columnSearch[key],
          );
          return (
            <div
              key={key}
              className={`ax-pulse-col min-h-[320px] md:min-h-0 ${
                index === 1 ? "md:mx-0.5 md:ring-1 md:ring-[var(--border-strong)]" : ""
              }`}
            >
              <div className="flex items-center gap-2 border-b border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">{title}</span>
                <span className="ml-auto rounded-sm border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-mono text-xs text-[var(--muted)]">
                  {colTokens.length}/{counts[key]}
                </span>
              </div>
              <ColumnFilterBar
                filters={columnFilters[key]}
                onChange={(f) => setColumnFilters((prev) => ({ ...prev, [key]: f }))}
              />
              <div
                className={`${ROW_GRID} gap-3 border-b border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]`}
              >
                <span>Token</span>
                <span>MC</span>
                <span>Vol</span>
                <span />
              </div>
              <div className="relative border-b border-[var(--border-strong)] px-4 py-2.5">
                <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-dim)]" />
                <input
                  value={columnSearch[key]}
                  onChange={(e) => setColumnSearch((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder="Search symbol or address…"
                  className="w-full rounded-sm border border-[var(--border)] bg-[var(--surface-solid)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {loading && !colTokens.length ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse border-b border-[var(--border)] bg-[var(--surface-hover)]" />
                  ))
                ) : (
                  colTokens.map((token) => (
                    <PulseRow key={token.id} token={token} onTrade={() => onNavigate("trade", token.id)} />
                  ))
                )}
                {!loading && colTokens.length === 0 && tokens.length > 0 && (
                  <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">No coins match filters</p>
                )}
                {!loading && tokens.length === 0 && (
                  <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">No live pump.fun coins — try Refresh</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}