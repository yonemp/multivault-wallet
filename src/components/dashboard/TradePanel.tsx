"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetMarketData } from "@/app/api/prices/route";
import { MARKET_ASSETS } from "@/lib/market/assets";
import { formatCompactUsd } from "@/lib/format/numbers";
import { TradingViewWidget } from "@/components/charts/TradingViewWidget";
import { PumpFunChart } from "@/components/charts/PumpFunChart";
import { FloatingInstantTrade } from "@/components/trade/FloatingInstantTrade";
import { WalletBubbleMap } from "@/components/trade/WalletBubbleMap";
import { LiveTradesFeed } from "@/components/trade/LiveTradesFeed";
import { SessionData, getAddress } from "@/lib/wallet/session";

type BottomTab = "positions" | "holders" | "traders" | "bubble";

type DexPair = {
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  marketCap?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number; m5?: number; h1?: number };
  txns?: { m5?: { buys?: number; sells?: number }; h24?: { buys?: number; sells?: number } };
  priceChange?: { m5?: number; h1?: number; h24?: number };
  url?: string;
  dexId?: string;
  bondingProgress?: number;
};

const TV_SYMBOLS: Record<string, string> = {
  sol: "BINANCE:SOLUSDT",
  btc: "BINANCE:BTCUSDT",
  eth: "BINANCE:ETHUSDT",
  bnb: "BINANCE:BNBUSDT",
};

function parseSolTokenAddress(assetId: string): string | null {
  if (!assetId.startsWith("sol-")) return null;
  const addr = assetId.slice(4);
  return addr.length >= 32 ? addr : null;
}

type TradePanelProps = {
  session: SessionData;
  initialAsset?: string;
  onSuccess?: () => void;
};

export function TradePanel({ session, initialAsset = "sol", onSuccess }: TradePanelProps) {
  const [selectedAsset, setSelectedAsset] = useState(initialAsset);
  const [market, setMarket] = useState<Record<string, AssetMarketData>>({});
  const [tokenPair, setTokenPair] = useState<DexPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("bubble");
  const [showInstant, setShowInstant] = useState(true);

  const tokenAddress = parseSolTokenAddress(selectedAsset);
  const tradableAssets = useMemo(() => MARKET_ASSETS.filter((a) => a.tradable), []);
  const asset = tradableAssets.find((a) => a.id === selectedAsset) ?? tradableAssets[0];
  const priceData = asset ? market[asset.id] : market.sol;

  const displaySymbol = tokenPair?.baseToken.symbol ?? asset?.symbol ?? "SOL";
  const displayName = tokenPair?.baseToken.name ?? asset?.name ?? "Solana";
  const price = tokenPair
    ? parseFloat(tokenPair.priceUsd ?? "0")
    : priceData?.price ?? 0;
  const liquidity = tokenPair?.liquidity?.usd ?? 0;
  const mcap = tokenPair?.marketCap ?? 0;
  const txCount = tokenPair
    ? (tokenPair.txns?.m5?.buys ?? 0) + (tokenPair.txns?.m5?.sells ?? 0)
    : 0;
  const bondingProgress = tokenPair?.bondingProgress ?? 0;

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

  useEffect(() => {
    if (!tokenAddress) {
      setTokenPair(null);
      return;
    }
    const addr: string = tokenAddress;

    async function loadToken() {
      setTokenLoading(true);
      try {
        const res = await fetch(`/api/token?address=${encodeURIComponent(addr)}`);
        const data = (await res.json()) as { pair: DexPair | null };
        setTokenPair(data.pair ?? null);
      } catch {
        setTokenPair(null);
      } finally {
        setTokenLoading(false);
      }
    }

    loadToken();
    const interval = setInterval(loadToken, 15_000);
    return () => clearInterval(interval);
  }, [tokenAddress]);

  const stats = tokenAddress
    ? [
        { label: "Price", value: price < 0.01 ? `$${price.toFixed(8)}` : `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}` },
        { label: "MC", value: formatCompactUsd(mcap) },
        { label: "Liquidity", value: formatCompactUsd(liquidity) },
        { label: "Replies", value: String(txCount) },
        { label: "Curve", value: `${bondingProgress.toFixed(0)}%` },
      ]
    : [
        { label: "Price", value: `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}` },
        { label: "24h", value: `${(priceData?.change24h ?? 0) >= 0 ? "+" : ""}${(priceData?.change24h ?? 0).toFixed(2)}%` },
        { label: "Source", value: "CoinGecko" },
      ];

  return (
    <div className="relative flex h-full flex-col gap-2 overflow-hidden">
      {showInstant && (
        <FloatingInstantTrade
          symbol={displaySymbol}
          onClose={() => setShowInstant(false)}
          onTrade={() => onSuccess?.()}
        />
      )}

      <div className="mv-panel flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center text-xs font-bold"
            style={{ background: "var(--surface-active)", border: "1px solid var(--border)", color: asset?.color ?? "var(--primary)" }}
          >
            {displaySymbol.slice(0, 3)}
          </span>
          <div>
            <p className="text-sm font-semibold">
              {tokenAddress ? `${displaySymbol}/SOL` : displaySymbol}
            </p>
            <p className="text-[10px] text-[var(--muted)]">
              {displayName}
              {tokenPair?.dexId && <span className="ml-1">· {tokenPair.dexId}</span>}
            </p>
          </div>
        </div>
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted)]">{s.label}</p>
            <p className={`font-mono text-xs font-semibold ${s.label === "Curve" ? "text-[var(--primary)]" : s.label === "24h" ? ((priceData?.change24h ?? 0) >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]") : ""}`}>
              {s.value}
            </p>
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
          {tokenPair?.url && (
            <a
              href={tokenPair.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 text-[9px] font-semibold text-[var(--primary)] hover:underline"
            >
              pump.fun
            </a>
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
            {tokenAddress ? (
              <PumpFunChart mint={tokenAddress} height={320} />
            ) : (
              <TradingViewWidget symbol={tvSymbol} height={320} />
            )}
          </div>

          <div className="mv-panel overflow-hidden">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)] uppercase text-[var(--muted)]">
                  <th className="px-3 py-1.5">Wallet</th>
                  <th className="px-3 py-1.5">Address</th>
                  <th className="px-3 py-1.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="ax-table-row">
                  <td className="px-3 py-1.5">
                    <span className="mr-1.5 rounded bg-[var(--primary-soft)] px-1 py-0.5 text-[8px] font-bold text-[var(--primary)]">YOU</span>
                    Your wallet
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[var(--muted)]">
                    {solAddress ? `${solAddress.slice(0, 4)}…${solAddress.slice(-4)}` : "Unlock wallet"}
                  </td>
                  <td className="px-3 py-1.5 text-right text-[var(--muted)]">
                    {tokenAddress ? "Holder % requires on-chain indexer" : "—"}
                  </td>
                </tr>
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
              {bottomTab === "bubble" && (
                <WalletBubbleMap symbol={displaySymbol} tokenAddress={tokenAddress ?? undefined} height={160} />
              )}
              {bottomTab === "positions" && (
                <p className="p-3 text-[10px] text-[var(--muted)]">Your open position in {displaySymbol} will appear here after trades.</p>
              )}
              {bottomTab === "holders" && (
                <p className="p-3 text-[10px] text-[var(--muted)]">
                  {tokenAddress
                    ? "Holder distribution requires a Solana indexer — not shown until live data is available."
                    : "Select a live pair from Pulse to view holder stats."}
                </p>
              )}
              {bottomTab === "traders" && (
                <p className="p-3 text-[10px] text-[var(--muted)]">Top traders by volume — requires on-chain trade indexer.</p>
              )}
            </div>
          </div>
        </div>

        <LiveTradesFeed symbol={displaySymbol} tokenAddress={tokenAddress ?? undefined} />
      </div>

      {(loading || tokenLoading) && (
        <p className="text-[9px] text-[var(--muted)]">
          {tokenLoading ? "Syncing from pump.fun…" : "Syncing prices…"}
        </p>
      )}
    </div>
  );
}