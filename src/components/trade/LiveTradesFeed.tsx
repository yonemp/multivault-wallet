"use client";

import { useEffect, useState } from "react";

type LiveTradesFeedProps = {
  symbol: string;
  tokenAddress?: string;
};

type TxnSnapshot = {
  buys: number;
  sells: number;
  volume: number;
  change5m: number;
  updatedAt: number;
};

export function LiveTradesFeed({ symbol, tokenAddress }: LiveTradesFeedProps) {
  const [snap, setSnap] = useState<TxnSnapshot | null>(null);
  const [history, setHistory] = useState<{ time: string; side: "buy" | "sell"; count: number }[]>([]);

  useEffect(() => {
    if (!tokenAddress) {
      setSnap(null);
      return;
    }
    const addr: string = tokenAddress;

    async function poll() {
      try {
        const res = await fetch(`/api/token?address=${encodeURIComponent(addr)}`);
        const data = await res.json();
        const pair = data.pair;
        if (!pair) return;

        const buys = pair.txns?.m5?.buys ?? 0;
        const sells = pair.txns?.m5?.sells ?? 0;
        const next: TxnSnapshot = {
          buys,
          sells,
          volume: pair.volume?.m5 ?? pair.volume?.h1 ?? 0,
          change5m: pair.priceChange?.m5 ?? 0,
          updatedAt: Date.now(),
        };
        setSnap(next);

        if (buys > 0) {
          setHistory((prev) => [
            { time: new Date().toLocaleTimeString(), side: "buy" as const, count: buys },
            ...prev,
          ].slice(0, 25));
        }
        if (sells > 0) {
          setHistory((prev) => [
            { time: new Date().toLocaleTimeString(), side: "sell" as const, count: sells },
            ...prev,
          ].slice(0, 25));
        }
      } catch {
        /* retry next poll */
      }
    }

    poll();
    const interval = setInterval(poll, 12_000);
    return () => clearInterval(interval);
  }, [tokenAddress]);

  return (
    <div className="mv-panel flex min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        <span className="ax-live-dot h-1.5 w-1.5 rounded-full bg-[var(--gain)]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Live Activity</span>
        <span className="ml-auto text-[9px] text-[var(--muted)]">{symbol}</span>
      </div>

      {snap && (
        <div className="grid grid-cols-3 gap-px border-b border-[var(--border)] bg-[var(--border)] text-center text-[10px]">
          <div className="bg-[var(--surface)] px-2 py-2">
            <p className="text-[var(--gain)] font-bold">{snap.buys}</p>
            <p className="text-[var(--muted)]">Buys 5m</p>
          </div>
          <div className="bg-[var(--surface)] px-2 py-2">
            <p className="text-[var(--loss)] font-bold">{snap.sells}</p>
            <p className="text-[var(--muted)]">Sells 5m</p>
          </div>
          <div className="bg-[var(--surface)] px-2 py-2">
            <p className={`font-bold ${snap.change5m >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
              {snap.change5m >= 0 ? "+" : ""}{snap.change5m.toFixed(1)}%
            </p>
            <p className="text-[var(--muted)]">5m</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {!tokenAddress && (
          <p className="px-3 py-6 text-center text-[10px] text-[var(--muted)]">Select a pump.fun coin from Pulse</p>
        )}
        {tokenAddress && !history.length && (
          <p className="px-3 py-6 text-center text-[10px] text-[var(--muted)]">Polling pump.fun for activity…</p>
        )}
        {history.map((h, i) => (
          <div key={i} className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-1.5 text-[10px]">
            <span className={`w-10 font-bold uppercase ${h.side === "buy" ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
              {h.side}
            </span>
            <span className="flex-1 font-mono text-[var(--muted)]">{h.count} txns (5m window)</span>
            <span className="font-mono text-[var(--muted-dim)]">{h.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}