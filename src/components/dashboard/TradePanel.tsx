"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { TradingChart, ChartLine } from "@/components/charts/TradingChart";
import type { AssetMarketData } from "@/app/api/prices/route";
import { MARKET_ASSETS } from "@/lib/market/assets";
import { SessionData } from "@/lib/wallet/session";
import { ArrowDownRight, ArrowUpRight, Target, Shield } from "lucide-react";

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
  const [showTpSl, setShowTpSl] = useState(true);
  const [orderNote, setOrderNote] = useState<string | null>(null);

  const tradableAssets = useMemo(
    () => MARKET_ASSETS.filter((a) => a.tradable),
    [],
  );

  const asset = useMemo(
    () => tradableAssets.find((a) => a.id === selectedAsset) ?? tradableAssets[0],
    [selectedAsset, tradableAssets],
  );

  const priceData = asset ? market[asset.id] : null;

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
      lines.push({
        id: "tp",
        price: parseFloat(takeProfit),
        color: "#059669",
        label: "Take Profit",
        style: "dashed",
      });
    }
    if (stopLoss && parseFloat(stopLoss) > 0) {
      lines.push({
        id: "sl",
        price: parseFloat(stopLoss),
        color: "#dc2626",
        label: "Stop Loss",
        style: "dashed",
      });
    }
    if (priceData?.price) {
      lines.push({
        id: "entry",
        price: priceData.price,
        color: "#2f6fed",
        label: "Market",
      });
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

  function handlePlaceOrder() {
    if (!amount || parseFloat(amount) <= 0) {
      setOrderNote("Enter a valid amount");
      return;
    }
    const label = side === "buy" ? "Buy" : "Sell";
    const tp = takeProfit ? ` · TP $${takeProfit}` : "";
    const sl = stopLoss ? ` · SL $${stopLoss}` : "";
    setOrderNote(
      `${label} order staged: ${amount} ${asset?.symbol} @ $${priceData?.price.toFixed(2) ?? "—"}${tp}${sl}. Execute via Swap tab for on-chain settlement.`,
    );
    onSuccess?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Trade</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Chart, take-profit & stop-loss levels · swap execution on-chain
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tradableAssets.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedAsset(a.id)}
              className={`border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                selectedAsset === a.id
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[var(--shadow-glow)]"
                  : "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--muted)] hover:border-[var(--primary)]"
              }`}
            >
              {a.symbol}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: `${asset?.color}18`,
                  color: asset?.color,
                  border: `1px solid ${asset?.color}40`,
                }}
              >
                {asset?.symbol.slice(0, 3)}
              </span>
              <div>
                <p className="font-semibold text-[var(--foreground)]">
                  {asset?.name} / USD
                </p>
                <p className="font-mono text-lg font-semibold text-[var(--foreground)]">
                  {loading ? "…" : `$${priceData?.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}`}
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">24h</p>
                <p className={`font-mono font-semibold ${(priceData?.change24h ?? 0) >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                  {(priceData?.change24h ?? 0) >= 0 ? "+" : ""}
                  {(priceData?.change24h ?? 0).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">4h</p>
                <p className={`font-mono font-semibold ${(priceData?.change4h ?? 0) >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                  {(priceData?.change4h ?? 0) >= 0 ? "+" : ""}
                  {(priceData?.change4h ?? 0).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {priceData?.sparkline24h?.length ? (
            <TradingChart
              data={priceData.sparkline24h}
              lines={showTpSl ? chartLines : chartLines.filter((l) => l.id === "entry")}
              onPriceClick={handleChartClick}
            />
          ) : (
            <div className="flex h-[380px] items-center justify-center text-sm text-[var(--muted)]">
              {loading ? "Loading chart…" : "Chart unavailable"}
            </div>
          )}

          <div className="flex flex-wrap gap-4 border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 bg-[#2f6fed]" /> Market
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-[#059669]" /> Take profit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-[#dc2626]" /> Stop loss
            </span>
            <span>Click chart to set TP/SL levels</span>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide("buy")}
                className={`flex items-center justify-center gap-2 border py-2.5 text-sm font-semibold transition ${
                  side === "buy"
                    ? "border-[var(--gain)] bg-[var(--gain-soft)] text-[var(--gain)]"
                    : "border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" /> Buy
              </button>
              <button
                type="button"
                onClick={() => setSide("sell")}
                className={`flex items-center justify-center gap-2 border py-2.5 text-sm font-semibold transition ${
                  side === "sell"
                    ? "border-[var(--loss)] bg-[var(--loss-soft)] text-[var(--loss)]"
                    : "border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                <ArrowDownRight className="h-4 w-4" /> Sell
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mv-label">Amount ({asset?.symbol})</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mv-label flex items-center gap-1.5">
                  <Target className="h-3 w-3" /> Take profit (USD)
                </label>
                <Input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="mv-label flex items-center gap-1.5">
                  <Shield className="h-3 w-3" /> Stop loss (USD)
                </label>
                <Input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
              <input
                type="checkbox"
                checked={showTpSl}
                onChange={(e) => setShowTpSl(e.target.checked)}
                className="accent-[var(--primary)]"
              />
              Show TP/SL on chart
            </label>

            <Button className="mt-4 w-full" size="lg" onClick={handlePlaceOrder}>
              {side === "buy" ? "Stage buy order" : "Stage sell order"}
            </Button>

            {orderNote && <p className="mv-alert-info mt-3 text-xs">{orderNote}</p>}
          </Panel>

          <Panel className="p-4 text-xs text-[var(--muted)]">
            <p className="font-medium text-[var(--foreground)]">Wallet</p>
            <p className="mt-1 capitalize">{session.walletType} · {session.mode}</p>
            <p className="mt-2">
              Orders are staged locally. Use <strong>Swap</strong> to execute on-chain via Jupiter / LI.FI.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}