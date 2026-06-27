"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetMarketData } from "@/app/api/prices/route";
import { MARKET_ASSETS } from "@/lib/market/assets";
import { buildMemeTokens, formatCompactUsd } from "@/lib/platform/mock-tokens";
import { TradingViewWidget } from "@/components/charts/TradingViewWidget";
import { FloatingInstantTrade } from "@/components/trade/FloatingInstantTrade";
import { WalletBubbleMap } from "@/components/trade/WalletBubbleMap";
import { LiveTradesFeed } from "@/components/trade/LiveTradesFeed";
import { SessionData, getAddress } from "@/lib/wallet/session";

type BottomTab = "positions" | "holders" | "traders" | "bubble";

const TV_SYMBOLS: Record<string, string> = {
  sol: "BINANCE:SOLUSDT",
  btc: "BINANCE:BTCUSDT",
  eth: "BINANCE:ETHUSDT",
  bnb: "BINANCE:BNBUSDT",
};

const WALLET_ROWS = [
  { role: "DEV", label: "Creator", address: "8xKm…4pRt", balance: "12.4%", bought: "$4.2K", sold: "$1.1K" },
  { role: "TRACKED", label: "Whale #1", address: "3nQw…7kLm", balance: "3.8%", bought: "$28K", sold: "$12K" },
  { role: "YOU", label: "Your wallet", address: "—", balance: "0.2%", bought: "$120", sold: "$0" },
];

type TradePanelProps = {
  session: SessionData;
  initialAsset?: string;
  onSuccess?: () => void;
};

export function TradePanel({ session, initialAsset = "sol", onSuccess }: TradePanelProps) {
  const [selectedAsset, setSelectedAsset] = useState(initialAsset);
  const [market, setMarket] = useState<Record<string, AssetMarketData>>({});
  const [loading, setLoading] = useState(true);
  const [bottomTab, setBottomTab] = useState<BottomTab>("bubble");
  const [showInstant, setShowInstant] = useState(true);

  const memeTokens = useMemo(() => buildMemeTokens(market.sol?.price ?? 140), [market.sol?.price]);
  const tradableAssets = useMemo(() => MARKET_ASSETS.filter((a) => a.tradable), []);
  const asset = tradableAssets.find((a) => a.id === selectedAsset) ?? tradableAssets[0];
  const memeToken = memeTokens.find((t) => t.id === selectedAsset);
  const priceData = asset ? market[asset.id] : market.sol;
  const displaySymbol = memeToken?.symbol ?? asset?.symbol ?? "SOL";
  const displayName = memeToken?.name ?? asset?.name ?? "Solana";
  const price = memeToken ? memeToken.mcap / 1e9 : priceData?.price ?? 0;
  const liquidity = memeToken?.liquidity ?? (priceData?.price ?? 0) * 1_200_000;
  const supply = memeToken ? "1B" : "—";
  const bondingCurve = memeToken ? `${Math.min(98, 60 + (memeToken.holders % 38))}%` : "—";

  const solAddress = getAddress(session, "solana");
  const tvSymbol = TV_SYMBOLS[asset?.id ?? "sol"] ?? "BINANCE:SOLUSDT";

  useEffect(() => {
    setSelectedAsset(initialAsset);
    setShowInstant(true);
  }, [initialAsset]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const ids = tradableAssets.map((a) => a.id).join(",");
        const res = await fetch(`/api/prices?assets=${ids}`);
        const data = (await res.json()) as { assets: Record<string, AssetMarketData> };
        setMarket(data.assets ?? {});
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 120_000);
    return () => clearInterval(interval);
  }, [tradableAssets]);

  const walletRows = WALLET_ROWS.map((w) =>
    w.role === "YOU"
      ? { ...w, address: solAddress ? `${solAddress.slice(0, 4)}…${solAddress.slice(-4)}` : "Unlock wallet" }
      : w,
  );

  return (
    <div className="relative flex h-full flex-col gap-2 overflow-hidden">
      {showInstant && (
        <FloatingInstantTrade
          symbol={displaySymbol}
          onClose={() => setShowInstant(false)}
          onTrade={() => onSuccess?.()}
        />
      )}

      {/* Pair header */}
      <div className="mv-panel flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center text-xs font-bold"
            style={{ background: "var(--surface-active)", border: "1px solid var(--border)", color: asset?.color ?? "var(--primary)" }}
          >
            {displaySymbol.slice(0, 3)}
          </span>
          <div>
            <p className="text-sm font-semibold">{displaySymbol}/SOL</p>
            <p className="text-[10px] text-[var(--muted)]">{displayName}</p>
          </div>
        </div>
        {[
          { label: "Price", value: memeToken ? `$${(price * 1e6).toFixed(4)}` : `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}` },
          { label: "Liquidity", value: formatCompactUsd(liquidity) },
          { label: "Supply", value: supply },
          { label: "B.Curve", value: bondingCurve },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted)]">{s.label}</p>
            <p className="font-mono text-xs font-semibold">{s.value}</p>
          </div>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-1">
          {!showInstant && (
            <button
              type="button"
              onClick={() => setShowInstant(true)}
              className="border border-[var(--gain)] bg-[var(--gain-soft)] px-2 py-1 text-[9px] font-bold text-[var(--gain)]"
            >
              Instant Trade
            </button>
          )}
          {tradableAssets.slice(0, 5).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedAsset(a.id)}
              className={`px-2 py-0.5 text-[9px] font-semibold uppercase ${
                selectedAsset === a.id ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[var(--muted)]"
              }`}
            >
              {a.symbol}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[1fr_260px]">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="mv-panel min-h-[280px] flex-1 overflow-hidden">
            <TradingViewWidget symbol={tvSymbol} height={320} />
          </div>

          <div className="mv-panel overflow-hidden">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)] uppercase text-[var(--muted)]">
                  <th className="px-3 py-1.5">Wallet</th>
                  <th className="px-3 py-1.5">Address</th>
                  <th className="px-3 py-1.5 text-right">%</th>
                  <th className="px-3 py-1.5 text-right">Bought</th>
                  <th className="px-3 py-1.5 text-right">Sold</th>
                </tr>
              </thead>
              <tbody>
                {walletRows.map((w) => (
                  <tr key={w.role} className="ax-table-row">
                    <td className="px-3 py-1.5">
                      <span className={`mr-1.5 rounded px-1 py-0.5 text-[8px] font-bold ${
                        w.role === "DEV" ? "bg-[var(--warning)]/20 text-[var(--warning)]" :
                        w.role === "YOU" ? "bg-[var(--primary-soft)] text-[var(--primary)]" :
                        "bg-[var(--surface-active)] text-[var(--muted)]"
                      }`}>{w.role}</span>
                      {w.label}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[var(--muted)]">{w.address}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{w.balance}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[var(--gain)]">{w.bought}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[var(--loss)]">{w.sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mv-panel flex min-h-[180px] flex-col overflow-hidden">
            <div className="flex border-b border-[var(--border)]">
              {([
                { id: "bubble" as const, label: "Bubble Map" },
                { id: "positions" as const, label: "Positions" },
                { id: "holders" as const, label: "Holders" },
                { id: "traders" as const, label: "Top Traders" },
              ]).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBottomTab(id)}
                  className={`px-3 py-2 text-[10px] font-semibold uppercase ${
                    bottomTab === id ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]" : "text-[var(--muted)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto">
              {bottomTab === "bubble" && <WalletBubbleMap symbol={displaySymbol} height={160} />}
              {bottomTab === "positions" && (
                <p className="p-3 text-[10px] text-[var(--muted)]">Your open position in {displaySymbol} will appear here after trades.</p>
              )}
              {bottomTab === "holders" && (
                <p className="p-3 text-[10px] text-[var(--muted)]">{memeToken?.holders ?? 1240} holders · top 10 hold {(38 + (memeToken?.holders ?? 0) % 20)}%</p>
              )}
              {bottomTab === "traders" && (
                <p className="p-3 text-[10px] text-[var(--muted)]">Top traders by volume — live indexer coming soon.</p>
              )}
            </div>
          </div>
        </div>

        <LiveTradesFeed symbol={displaySymbol} />
      </div>

      {loading && <p className="text-[9px] text-[var(--muted)]">Syncing prices…</p>}
    </div>
  );
}