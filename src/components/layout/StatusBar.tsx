"use client";

import { useEffect, useState } from "react";
import type { AssetMarketData } from "@/app/api/prices/route";
import { safeFixed, safeNumber } from "@/lib/format/numbers";

export function StatusBar() {
  const [solPrice, setSolPrice] = useState<AssetMarketData | null>(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    fetch("/api/prices?assets=sol")
      .then((r) => r.json())
      .then((d) => setSolPrice(d.assets?.sol ?? null))
      .catch(() => {});

    const tick = () => {
      setTime(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-50 flex h-[var(--status-h)] items-center justify-between border-t border-[var(--border)] bg-[var(--bg-elevated)]/90 px-4 text-[11px] backdrop-blur-xl"
      style={{ height: "var(--status-h)" }}
    >
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[var(--muted)]">
          <span className="ax-live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--gain)]" />
          Mainnet
        </span>
        <span className="font-mono text-[var(--foreground)]">
          SOL{" "}
          <span className="text-[var(--primary)]">
            ${safeFixed(solPrice?.price, 2)}
          </span>
          {solPrice && Number.isFinite(safeNumber(solPrice.change24h, NaN)) && (
            <span
              className={`ml-1 ${safeNumber(solPrice.change24h) >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}
            >
              {safeNumber(solPrice.change24h) >= 0 ? "+" : ""}
              {safeFixed(solPrice.change24h, 2)}%
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-4 text-[var(--muted)]">
        <span>MultiVault Terminal</span>
        <span className="font-mono">{time}</span>
      </div>
    </footer>
  );
}