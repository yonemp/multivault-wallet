"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TradingChart, ChartLine } from "@/components/charts/TradingChart";
import type { AssetMarketData } from "@/app/api/prices/route";
import { MARKET_ASSETS } from "@/lib/market/assets";
import { TradingViewWidget } from "@/components/charts/TradingViewWidget";
import { addLimitOrder, loadLimitOrders, cancelLimitOrder } from "@/lib/platform/limit-orders";
import { addTradePoints } from "@/lib/platform/rewards";
import { SessionData } from "@/lib/wallet/session";

type TradeMode = "market" | "limit" | "sniper" | "tradingview";

type TradePanelProps = {
  session: SessionData;
  initialAsset?: string;
  onSuccess?: () => void;
};

type TradeSide = "buy" | "sell";

export function TradePanel({ session, initialAsset = "sol", onSuccess }: TradePanelProps) {
  const [selectedAsset, setSelectedAsset] = useState(initialAsset);
  const [market, setMarket] = useState<Record<string, AssetMarketData>>({});
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState<TradeSide>("buy");
  const [amount, setAmount] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [tradeMode, setTradeMode] = useState<TradeMode>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [chartTab, setChartTab] = useState<"chart" | "orders" | "holders">("chart");
  const [orderNote, setOrderNote] = useState<string | null>(null);
  const [openOrders, setOpenOrders] = useState<ReturnType<typeof loadLimitOrders>>([]);

  useEffect(() => {
    setOpenOrders(loadLimitOrders());
  }, []);

  const tradableAssets = useMemo(() => MARKET_ASSETS.filter((a) => a.tradable), []);
  const asset = tradableAssets.find((a) => a.id === selectedAsset) ?? tradableAssets[0];
  const priceData = asset ? market[asset.id] : null;

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

  const chartLines = useMemo((): ChartLine[] => {
    const lines: ChartLine[] = [];
    if (takeProfit && parseFloat(takeProfit) > 0) {
      lines.push({ id: "tp", price: parseFloat(takeProfit), color: "#00c076", label: "TP", style: "dashed" });
    }
    if (stopLoss && parseFloat(stopLoss) > 0) {
      lines.push({ id: "sl", price: parseFloat(stopLoss), color: "#ff4d6a", label: "SL", style: "dashed" });
    }
    if (priceData?.price) {
      lines.push({ id: "entry", price: priceData.price, color: "#526fff", label: "Market" });
    }
    return lines;
  }, [takeProfit, stopLoss, priceData?.price]);

  const handleChartClick = useCallback(
    (price: number) => {
      const rounded = price.toFixed(price > 100 ? 2 : 4);
      if (!takeProfit) setTakeProfit(rounded);
      else if (!stopLoss) setStopLoss(rounded);
      else setTakeProfit(rounded);
    },
    [takeProfit, stopLoss],
  );

  function refreshOrders() {
    setOpenOrders(loadLimitOrders());
  }

  function handlePlaceOrder() {
    if (!amount || parseFloat(amount) <= 0) {
      setOrderNote("Enter a valid amount");
      return;
    }

    if (tradeMode === "limit" || tradeMode === "sniper") {
      const price = parseFloat(limitPrice || String(priceData?.price ?? 0));
      if (!price || price <= 0) {
        setOrderNote("Set a limit price");
        return;
      }
      addLimitOrder({
        asset: asset?.symbol ?? "SOL",
        side,
        price,
        amount: parseFloat(amount),
        type: tradeMode === "sniper" ? "sniper" : "limit",
      });
      addTradePoints(50);
      refreshOrders();
      setOrderNote(
        `${tradeMode === "sniper" ? "Sniper" : "Limit"} ${side} placed @ $${price} · MEV-resistant staging`,
      );
      onSuccess?.();
      return;
    }

    addTradePoints(25);
    setOrderNote(
      `Market ${side} staged · ${amount} ${asset?.symbol} · execute via Swap / Convert`,
    );
    onSuccess?.();
  }

  return (
    <div className="flex h-full flex-col gap-0 overflow-hidden">
      {/* Pair summary — Axiom top bar */}
      <div className="mv-panel flex flex-wrap items-center gap-4 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center text-xs font-bold"
            style={{ background: "var(--surface-active)", border: "1px solid var(--border)", color: asset?.color }}
          >
            {asset?.symbol.slice(0, 3)}
          </span>
          <div>
            <p className="text-sm font-semibold">{asset?.symbol}/USD</p>
            <p className="text-[10px] text-[var(--muted)]">{asset?.name}</p>
          </div>
        </div>
        <div className="h-8 w-px bg-[var(--border)]" />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Price</p>
          <p className="font-mono text-sm font-semibold">
            ${priceData?.price.toLocaleString(undefined, { maximumFractionDigits: 4 }) ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">24h</p>
          <p className={`font-mono text-sm font-semibold ${(priceData?.change24h ?? 0) >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
            {(priceData?.change24h ?? 0) >= 0 ? "+" : ""}{(priceData?.change24h ?? 0).toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">4h</p>
          <p className={`font-mono text-sm font-semibold ${(priceData?.change4h ?? 0) >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
            {(priceData?.change4h ?? 0) >= 0 ? "+" : ""}{(priceData?.change4h ?? 0).toFixed(2)}%
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-1">
          {tradableAssets.slice(0, 6).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedAsset(a.id)}
              className={`px-2 py-1 text-[10px] font-semibold uppercase ${
                selectedAsset === a.id
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {a.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Main terminal grid */}
      <div className="mt-2 grid min-h-0 flex-1 gap-2 lg:grid-cols-[1fr_300px]">
        <div className="mv-panel flex min-h-0 flex-col overflow-hidden">
          <div className="flex border-b border-[var(--border)]">
            {(["chart", "orders", "holders"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setChartTab(tab)}
                className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wide ${
                  chartTab === tab
                    ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {chartTab === "chart" && (
            <>
              {priceData?.sparkline24h?.length ? (
                <TradingChart
                  data={priceData.sparkline24h}
                  lines={chartLines}
                  onPriceClick={handleChartClick}
                  height={380}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-[var(--muted)]">
                  {loading ? "Loading…" : "No data"}
                </div>
              )}
              <div className="flex gap-4 border-t border-[var(--border)] px-3 py-1.5 text-[10px] text-[var(--muted)]">
                <span><span className="text-[#526fff]">━</span> Market</span>
                <span><span className="text-[#00c076]">┄</span> Take profit</span>
                <span><span className="text-[#ff4d6a]">┄</span> Stop loss</span>
                <span className="ml-auto">Click chart to set levels</span>
              </div>
            </>
          )}
          {chartTab === "orders" && (
            <div className="flex-1 overflow-auto p-3 text-xs">
              {openOrders.length === 0 ? (
                <p className="text-center text-[var(--muted)]">No orders yet</p>
              ) : (
                openOrders.map((o) => (
                  <div key={o.id} className="flex justify-between border-b border-[var(--border)] py-2">
                    <span>{o.type} {o.side} {o.amount} {o.asset} @ ${o.price}</span>
                    <span className={o.status === "open" ? "text-[var(--primary)]" : "text-[var(--muted)]"}>{o.status}</span>
                  </div>
                ))
              )}
            </div>
          )}
          {chartTab === "holders" && (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-[var(--muted)]">
              Holder data · coming soon
            </div>
          )}
        </div>

        {/* Order panel */}
        <div className="flex flex-col gap-2">
          <div className="mv-panel p-3">
            <div className="mb-3 flex flex-wrap gap-1 border-b border-[var(--border)] pb-2">
              {(["market", "limit", "sniper", "tradingview"] as TradeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTradeMode(m)}
                  className={`px-2 py-1 text-[9px] font-bold uppercase ${
                    tradeMode === m
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {m === "tradingview" ? "TV Chart" : m}
                </button>
              ))}
            </div>

            {tradeMode === "tradingview" ? (
              <TradingViewWidget symbol="BINANCE:SOLUSDT" height={320} />
            ) : (
              <>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="buy" size="lg" className="w-full" onClick={() => setSide("buy")}>
                Buy
              </Button>
              <Button variant="sell" size="lg" className="w-full" onClick={() => setSide("sell")}>
                Sell
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <button type="button" className="border border-[var(--border)] py-1.5 text-[10px] font-semibold uppercase text-[var(--muted)] hover:bg-[var(--surface-hover)]">
                Buy dip
              </button>
              <button type="button" className="border border-[var(--border)] py-1.5 text-[10px] font-semibold uppercase text-[var(--muted)] hover:bg-[var(--surface-hover)]">
                Breakout
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {(tradeMode === "limit" || tradeMode === "sniper") && (
                <div>
                  <label className="mv-label">
                    {tradeMode === "sniper" ? "Snipe price (USD)" : "Limit price (USD)"}
                  </label>
                  <Input
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder={String(priceData?.price.toFixed(2) ?? "0")}
                    type="number"
                  />
                </div>
              )}
              <div>
                <label className="mv-label">Amount ({asset?.symbol})</label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" type="number" step="any" />
              </div>
              <div>
                <label className="mv-label">Take profit</label>
                <Input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="USD" type="number" />
              </div>
              <div>
                <label className="mv-label">Stop loss</label>
                <Input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="USD" type="number" />
              </div>
            </div>

            <Button
              className="mt-3 w-full"
              variant={side === "buy" ? "buy" : "sell"}
              size="lg"
              onClick={handlePlaceOrder}
            >
              {tradeMode === "sniper"
                ? "Snipe"
                : tradeMode === "limit"
                  ? `Place limit ${side}`
                  : side === "buy"
                    ? "Buy now"
                    : "Sell now"}
            </Button>
            {orderNote && <p className="mv-alert-info mt-2 text-[10px]">{orderNote}</p>}
              </>
            )}
          </div>

          {openOrders.filter((o) => o.status === "open").length > 0 && (
            <div className="mv-panel max-h-32 overflow-auto p-2 text-[10px]">
              <p className="mb-1 font-semibold uppercase text-[var(--muted)]">Open orders</p>
              {openOrders.filter((o) => o.status === "open").map((o) => (
                <div key={o.id} className="flex items-center justify-between border-b border-[var(--border)] py-1">
                  <span>{o.type} {o.side} {o.asset} @ ${o.price}</span>
                  <button type="button" className="text-[var(--loss)]" onClick={() => { cancelLimitOrder(o.id); refreshOrders(); }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div className="mv-panel p-3 text-[10px] text-[var(--muted)]">
            <p className="font-medium text-[var(--foreground)]">Wallet</p>
            <p className="mt-1 capitalize">{session.walletType} · {session.mode}</p>
            <p className="mt-2">Stage orders here · settle on-chain via Swap tab</p>
          </div>
        </div>
      </div>
    </div>
  );
}