"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AssetMarketData } from "@/app/api/prices/route";
import { MARKET_ASSETS } from "@/lib/market/assets";
import { buildMemeTokens, formatCompactUsd } from "@/lib/platform/mock-tokens";
import { TradingViewWidget } from "@/components/charts/TradingViewWidget";
import { addLimitOrder, loadLimitOrders, cancelLimitOrder } from "@/lib/platform/limit-orders";
import { addTradePoints } from "@/lib/platform/rewards";
import { SessionData, getAddress } from "@/lib/wallet/session";

type TradeMode = "market" | "limit" | "sniper";
type TradeSide = "buy" | "sell";
type BottomTab = "positions" | "holders" | "traders";

const TV_SYMBOLS: Record<string, string> = {
  sol: "BINANCE:SOLUSDT",
  btc: "BINANCE:BTCUSDT",
  eth: "BINANCE:ETHUSDT",
  bnb: "BINANCE:BNBUSDT",
};

const QUICK_PCTS = [10, 25, 50, 100];

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
  const [side, setSide] = useState<TradeSide>("buy");
  const [amount, setAmount] = useState("");
  const [tradeMode, setTradeMode] = useState<TradeMode>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [bottomTab, setBottomTab] = useState<BottomTab>("positions");
  const [orderNote, setOrderNote] = useState<string | null>(null);
  const [openOrders, setOpenOrders] = useState<ReturnType<typeof loadLimitOrders>>([]);
  const [solBalance] = useState(4.28);

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
    setOpenOrders(loadLimitOrders());
  }, []);

  useEffect(() => {
    setSelectedAsset(initialAsset);
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

  const refreshOrders = useCallback(() => setOpenOrders(loadLimitOrders()), []);

  function applyQuickPct(pct: number) {
    const sol = solBalance * (pct / 100);
    setAmount(sol.toFixed(4));
  }

  function handlePlaceOrder() {
    if (!amount || parseFloat(amount) <= 0) {
      setOrderNote("Enter a valid amount");
      return;
    }
    if (tradeMode === "limit" || tradeMode === "sniper") {
      const p = parseFloat(limitPrice || String(price));
      if (!p || p <= 0) {
        setOrderNote("Set a limit price");
        return;
      }
      addLimitOrder({
        asset: displaySymbol,
        side,
        price: p,
        amount: parseFloat(amount),
        type: tradeMode === "sniper" ? "sniper" : "limit",
      });
      addTradePoints(50);
      refreshOrders();
      setOrderNote(`${tradeMode} ${side} @ $${p}`);
      onSuccess?.();
      return;
    }
    addTradePoints(25);
    setOrderNote(`Market ${side} · ${amount} SOL → ${displaySymbol}`);
    onSuccess?.();
  }

  const walletRows = WALLET_ROWS.map((w) =>
    w.role === "YOU"
      ? { ...w, address: solAddress ? `${solAddress.slice(0, 4)}…${solAddress.slice(-4)}` : "Unlock wallet" }
      : w,
  );

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden">
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
        <div className="ml-auto flex flex-wrap gap-1">
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

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[1fr_280px]">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="mv-panel min-h-[320px] flex-1 overflow-hidden">
            <TradingViewWidget symbol={tvSymbol} height={360} />
          </div>

          {/* DEV / TRACKED / YOU */}
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

          <div className="mv-panel flex min-h-[140px] flex-col overflow-hidden">
            <div className="flex border-b border-[var(--border)]">
              {(["positions", "holders", "traders"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setBottomTab(tab)}
                  className={`px-4 py-2 text-[10px] font-semibold uppercase ${
                    bottomTab === tab ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]" : "text-[var(--muted)]"
                  }`}
                >
                  {tab === "traders" ? "Top Traders" : tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto p-3 text-[10px] text-[var(--muted)]">
              {bottomTab === "positions" && <p>Your open position in {displaySymbol} will appear here after trades.</p>}
              {bottomTab === "holders" && <p>{memeToken?.holders ?? 1240} holders · top 10 hold {(38 + (memeToken?.holders ?? 0) % 20)}%</p>}
              {bottomTab === "traders" && <p>Top traders by volume — live data coming with indexer integration.</p>}
            </div>
          </div>
        </div>

        {/* Order panel */}
        <div className="flex flex-col gap-2">
          <div className="mv-panel p-3">
            <div className="mb-2 flex gap-1 border-b border-[var(--border)] pb-2">
              {(["market", "limit", "sniper"] as TradeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTradeMode(m)}
                  className={`flex-1 py-1 text-[9px] font-bold uppercase ${
                    tradeMode === m ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[var(--muted)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1">
              <Button variant="buy" size="lg" className="w-full" onClick={() => setSide("buy")}>Buy</Button>
              <Button variant="sell" size="lg" className="w-full" onClick={() => setSide("sell")}>Sell</Button>
            </div>

            <div className="mt-2 grid grid-cols-4 gap-1">
              {QUICK_PCTS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyQuickPct(pct)}
                  className="border border-[var(--border)] py-1 text-[9px] font-bold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  {pct}%
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {(tradeMode === "limit" || tradeMode === "sniper") && (
                <div>
                  <label className="mv-label">Limit price</label>
                  <Input value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder={String(price)} type="number" />
                </div>
              )}
              <div>
                <label className="mv-label">Amount (SOL)</label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" type="number" step="any" />
              </div>
              <p className="text-[9px] text-[var(--muted)]">Balance: {solBalance} SOL</p>
            </div>

            <Button className="mt-3 w-full" variant={side === "buy" ? "buy" : "sell"} size="lg" onClick={handlePlaceOrder}>
              {tradeMode === "sniper" ? "Snipe" : side === "buy" ? "Buy" : "Sell"}
            </Button>
            {orderNote && <p className="mv-alert-info mt-2 text-[9px]">{orderNote}</p>}
            {loading && <p className="mt-1 text-[9px] text-[var(--muted)]">Loading prices…</p>}
          </div>

          {openOrders.filter((o) => o.status === "open").length > 0 && (
            <div className="mv-panel max-h-28 overflow-auto p-2 text-[9px]">
              {openOrders.filter((o) => o.status === "open").map((o) => (
                <div key={o.id} className="flex justify-between border-b border-[var(--border)] py-1">
                  <span>{o.type} {o.side} {o.asset}</span>
                  <button type="button" className="text-[var(--loss)]" onClick={() => { cancelLimitOrder(o.id); refreshOrders(); }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}