"use client";

import { useEffect, useState } from "react";
import { buildLiveTrade, LiveTrade } from "@/lib/platform/mock-trade-data";

type LiveTradesFeedProps = {
  symbol: string;
  maxItems?: number;
};

export function LiveTradesFeed({ symbol, maxItems = 20 }: LiveTradesFeedProps) {
  const [trades, setTrades] = useState<LiveTrade[]>([]);
  useEffect(() => {
    const initial = Array.from({ length: 8 }, (_, i) => buildLiveTrade(i + symbol.length));
    setTrades(initial);

    const interval = setInterval(() => {
      setTrades((prev) => {
        const next = buildLiveTrade(Date.now() + prev.length);
        return [next, ...prev].slice(0, maxItems);
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [symbol, maxItems]);

  return (
    <div className="mv-panel flex min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        <span className="ax-live-dot h-1.5 w-1.5 rounded-full bg-[var(--gain)]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Live Trades</span>
        <span className="ml-auto text-[9px] text-[var(--muted)]">{symbol}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {trades.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-1.5 text-[10px] transition hover:bg-[var(--surface-hover)]"
          >
            <span
              className={`w-8 shrink-0 font-bold uppercase ${
                t.side === "buy" ? "text-[var(--gain)]" : "text-[var(--loss)]"
              }`}
            >
              {t.side}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-[var(--muted)]">{t.wallet}</span>
            <span className="font-mono font-semibold">{t.amountSol} SOL</span>
            <span className="font-mono text-[var(--muted)]">${t.amountUsd}</span>
            {t.tag && (
              <span className="rounded bg-[var(--surface-active)] px-1 py-0.5 text-[8px] uppercase text-[var(--warning)]">
                {t.tag}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}