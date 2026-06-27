"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { MARKET_ASSETS } from "@/lib/market/assets";
import type { AssetMarketData } from "@/app/api/prices/route";
import { addTradePoints } from "@/lib/platform/rewards";
import { Zap } from "lucide-react";

type InstantTradePanelProps = {
  onSuccess?: () => void;
};

export function InstantTradePanel({ onSuccess }: InstantTradePanelProps) {
  const [market, setMarket] = useState<Record<string, AssetMarketData>>({});
  const [asset, setAsset] = useState("sol");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => setMarket(d.assets ?? {}));
  }, []);

  const meta = MARKET_ASSETS.find((a) => a.id === asset);
  const price = market[asset]?.price;

  function instant(side: "buy" | "sell") {
    addTradePoints(25);
    setNote(`${side === "buy" ? "Buy" : "Sell"} staged instantly · ${meta?.symbol} @ $${price?.toFixed(2) ?? "â€”"} · execute via Swap`);
    onSuccess?.();
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Instant Trade"
        description="One-click execution â€” no order configuration"
      />

      <div className="mv-panel p-5">
        <div className="flex flex-wrap gap-2">
          {MARKET_ASSETS.filter((a) => a.tradable).slice(0, 6).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAsset(a.id)}
              className={`px-3 py-1.5 text-xs font-semibold ${
                asset === a.id
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {a.symbol}
            </button>
          ))}
        </div>

        <p className="mt-4 font-mono text-2xl font-bold">
          ${price?.toLocaleString(undefined, { maximumFractionDigits: 4 }) ?? "â€”"}
        </p>
        <p className="text-sm text-[var(--muted)]">{meta?.name}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="buy" size="lg" className="w-full" onClick={() => instant("buy")}>
            <Zap className="mr-2 h-4 w-4" /> Instant Buy
          </Button>
          <Button variant="sell" size="lg" className="w-full" onClick={() => instant("sell")}>
            <Zap className="mr-2 h-4 w-4" /> Instant Sell
          </Button>
        </div>

        {note && <p className="mv-alert-info mt-4 text-xs">{note}</p>}
      </div>
    </div>
  );
}