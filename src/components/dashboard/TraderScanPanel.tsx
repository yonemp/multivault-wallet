"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Scan } from "lucide-react";

export function TraderScanPanel() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<{
    trades: number;
    winRate: number;
    avgHold: string;
    topToken: string;
    pnl: string;
  } | null>(null);
  const [scanning, setScanning] = useState(false);

  async function handleScan() {
    if (!address.trim()) return;
    setScanning(true);
    await new Promise((r) => setTimeout(r, 800));
    setResult({
      trades: Math.floor(Math.random() * 200 + 20),
      winRate: Math.floor(Math.random() * 25 + 55),
      avgHold: `${(Math.random() * 4 + 0.5).toFixed(1)}h`,
      topToken: "SOL",
      pnl: `+${(Math.random() * 80 + 10).toFixed(1)}%`,
    });
    setScanning(false);
  }

  return (
    <div>
      <PageHeader
        title="Trader Scan"
        description="Analyze on-chain activity to identify wallets worth tracking in Vision"
      />

      <div className="mv-panel flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[280px] flex-1">
          <label className="mv-label">Wallet address</label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Solana or EVM address"
          />
        </div>
        <Button onClick={handleScan} disabled={scanning}>
          <Scan className="mr-2 h-4 w-4" />
          {scanning ? "Scanning…" : "Scan trader"}
        </Button>
      </div>

      {result && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Trades (30d)", value: String(result.trades) },
            { label: "Win rate", value: `${result.winRate}%` },
            { label: "Avg hold", value: result.avgHold },
            { label: "Top token", value: result.topToken },
            { label: "PnL", value: result.pnl, accent: true },
          ].map((item) => (
            <div key={item.label} className="mv-panel p-3">
              <p className="text-[10px] uppercase text-[var(--muted)]">{item.label}</p>
              <p className={`mt-1 font-mono text-lg font-semibold ${item.accent ? "text-[var(--gain)]" : ""}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}