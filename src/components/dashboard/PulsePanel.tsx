"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePulseColumnResize } from "@/hooks/usePulseColumnResize";
import type { PulseToken } from "@/app/api/pulse/route";
import type { PulseTicker } from "@/app/api/pulse/tickers/route";
import { DashboardTab, type NavigateMeta } from "@/components/dashboard/ActionTabs.types";
import { PulseCoinCard } from "@/components/dashboard/PulseCoinCard";
import {
  applyPulseColumnFilters,
  countActivePulseFilters,
  DEFAULT_PULSE_FILTERS,
  PulseFiltersModal,
  type PulseColumnFilterState,
  type PulseColumnKey,
} from "@/components/dashboard/PulseColumnFilters";
import { formatPulseAge } from "@/lib/pulse/format";
import { Filter } from "lucide-react";

const COLUMNS: { key: PulseToken["column"]; title: string }[] = [
  { key: "new", title: "New Pairs" },
  { key: "final", title: "Final Stretch" },
  { key: "migrated", title: "Migrated" },
];

type PulsePanelProps = {
  onNavigate: (tab: DashboardTab, asset?: string, meta?: NavigateMeta) => void;
};

function mergeTicker(token: PulseToken, tick: PulseTicker, solUsd: number, reserveRef: React.MutableRefObject<Record<string, number>>, volAccumRef: React.MutableRefObject<Record<string, number>>) {
  let volume = tick.volume;
  const prevReserves = reserveRef.current[token.address];
  if (prevReserves != null && tick.quoteReserves > 0) {
    const deltaSol = Math.abs(tick.quoteReserves - prevReserves) / 1e9;
    if (deltaSol > 0) {
      volAccumRef.current[token.address] =
        (volAccumRef.current[token.address] ?? token.volume) + deltaSol * solUsd;
    }
  }
  reserveRef.current[token.address] = tick.quoteReserves;
  if (volAccumRef.current[token.address] != null) {
    volume = Math.max(volume, volAccumRef.current[token.address]);
  }

  return {
    ...token,
    mcap: tick.mcap,
    volume,
    ageMs: tick.ageMs,
    age: tick.ageMs > 0 ? formatPulseAge(tick.ageMs) : token.age,
    solLiquidity: tick.solLiquidity,
    txCount: tick.txCount,
    buyTx: tick.buyTx ?? token.buyTx,
    sellTx: tick.sellTx ?? token.sellTx,
    top10HoldersPct: tick.top10HoldersPct ?? token.top10HoldersPct,
    devHoldingPct: tick.devHoldingPct ?? token.devHoldingPct,
    snipersPct: tick.snipersPct ?? token.snipersPct,
    holders: tick.holders ?? token.holders,
    sniperCount: tick.sniperCount ?? token.sniperCount,
    proTraders: tick.proTraders ?? token.proTraders,
  };
}

export function PulsePanel({ onNavigate }: PulsePanelProps) {
  const [tokens, setTokens] = useState<PulseToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tokensRef = useRef<PulseToken[]>([]);
  const reserveRef = useRef<Record<string, number>>({});
  const volAccumRef = useRef<Record<string, number>>({});
  const solUsdRef = useRef(140);

  const [columnFilters, setColumnFilters] = useState<Record<PulseToken["column"], PulseColumnFilterState>>({
    new: { ...DEFAULT_PULSE_FILTERS },
    final: { ...DEFAULT_PULSE_FILTERS },
    migrated: { ...DEFAULT_PULSE_FILTERS },
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterColumn, setFilterColumn] = useState<PulseColumnKey>("new");
  const { widths, dragging, gridRef, startDrag } = usePulseColumnResize();

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const loadPulse = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch("/api/pulse", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { tokens: PulseToken[]; updatedAt?: number };
      setTokens(data.tokens ?? []);
      for (const t of data.tokens ?? []) {
        volAccumRef.current[t.address] = t.volume;
      }
    } catch {
      if (!silent) setError("Could not load live coins from pump.fun");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const refreshTickers = useCallback(async () => {
    const current = tokensRef.current;
    if (!current.length) return;
    try {
      const mints = current.map((t) => t.address).join(",");
      const res = await fetch(`/api/pulse/tickers?mints=${encodeURIComponent(mints)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        tickers?: Record<string, PulseTicker>;
        solUsd?: number;
      };
      if (data.solUsd) solUsdRef.current = data.solUsd;

      setTokens((prev) =>
        prev.map((t) => {
          const tick = data.tickers?.[t.address];
          if (!tick) return t;
          return mergeTicker(t, tick, solUsdRef.current, reserveRef, volAccumRef);
        }),
      );
    } catch {
      /* ticker refresh is best-effort */
    }
  }, []);

  useEffect(() => {
    void loadPulse();
    const fullInterval = setInterval(() => void loadPulse(true), 30_000);
    return () => clearInterval(fullInterval);
  }, [loadPulse]);

  useEffect(() => {
    const tickerInterval = setInterval(() => void refreshTickers(), 1000);
    return () => clearInterval(tickerInterval);
  }, [refreshTickers]);

  const counts = useMemo(() => ({
    new: tokens.filter((t) => t.column === "new").length,
    final: tokens.filter((t) => t.column === "final").length,
    migrated: tokens.filter((t) => t.column === "migrated").length,
  }), [tokens]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PulseFiltersModal
        open={filtersOpen}
        activeColumn={filterColumn}
        columnCounts={counts}
        allFilters={columnFilters}
        onColumnChange={setFilterColumn}
        onChange={(col, f) => setColumnFilters((prev) => ({ ...prev, [col]: f }))}
        onClose={() => setFiltersOpen(false)}
        onRefresh={() => void loadPulse()}
      />

      {error && <p className="mv-alert-error mb-3 text-sm">{error}</p>}

      <div ref={gridRef} className="ax-pulse-resize-grid min-h-0 flex-1 overflow-hidden">
        {COLUMNS.map(({ key, title }, index) => {
          const colTokens = applyPulseColumnFilters(
            tokens.filter((t) => t.column === key),
            columnFilters[key],
          );
          const activeFilters = countActivePulseFilters(columnFilters[key]);

          return (
            <Fragment key={key}>
              {index > 0 && (
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label={`Resize ${COLUMNS[index - 1].title} and ${title}`}
                  className={`ax-pulse-resize-handle ${dragging === index - 1 ? "is-dragging" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    startDrag((index - 1) as 0 | 1, e.clientX);
                  }}
                />
              )}
              <div
                className="ax-pulse-col min-h-[320px] md:min-h-0"
                style={{ ["--col-width" as string]: `${widths[index]}%` }}
              >
                <div className="flex items-center gap-2 border-b border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2.5">
                  <span className="text-sm font-bold uppercase tracking-widest text-[var(--foreground)]">{title}</span>
                  <button
                    type="button"
                    onClick={() => { setFilterColumn(key); setFiltersOpen(true); }}
                    className={`ax-pulse-col-header-filter ml-auto ${activeFilters > 0 ? "active" : ""}`}
                  >
                    <Filter className="h-3 w-3" />
                    {activeFilters > 0 && <span className="badge">{activeFilters}</span>}
                  </button>
                  <span className="rounded-sm border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-mono text-xs text-[var(--muted)]">
                    {colTokens.length}/{counts[key]}
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {loading && !colTokens.length ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="ax-pulse-coin-skeleton" />
                    ))
                  ) : (
                    colTokens.map((token) => (
                      <PulseCoinCard
                        key={token.id}
                        token={token}
                        onTrade={() =>
                          onNavigate("trade", token.id, {
                            symbol: token.symbol,
                            name: token.name,
                            imageUri: token.imageUri,
                          })
                        }
                      />
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
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}