"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardTab } from "@/components/dashboard/ActionTabs";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { PnlCalendarModal } from "@/components/dashboard/PnlCalendarModal";
import type { AssetMarketData } from "@/app/api/prices/route";
import { getMarketAssetByChain } from "@/lib/market/assets";
import { CHAIN_LIST } from "@/lib/wallet/chains";
import { ChainBalances } from "@/lib/wallet/balances-client";
import { getAddress, getSessionChains, SessionData } from "@/lib/wallet/session";
import { Calendar, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";

type OverviewPanelProps = {
  session: SessionData;
  balances: ChainBalances;
  loading?: boolean;
  onNavigate: (tab: DashboardTab, asset?: string) => void;
  onRefresh?: () => void;
};

const PORTFOLIO_TABS = ["Spot", "Wallets", "Perpetuals"] as const;
const BOTTOM_TABS = ["Active Positions", "Activity", "Transfers"] as const;

const MOCK_POSITIONS = [
  { token: "SOL", size: "12.4", entry: "$138.20", pnl: "+$84.20", pnlPct: "+4.9%" },
  { token: "BONK", size: "2.1M", entry: "$0.000021", pnl: "-$12.40", pnlPct: "-2.1%" },
  { token: "WIF", size: "340", entry: "$2.84", pnl: "+$156.00", pnlPct: "+19.2%" },
];

function seeded(seed: number) {
  const x = Math.sin(seed * 5555) * 10000;
  return x - Math.floor(x);
}

export function OverviewPanel({
  session,
  balances,
  loading,
  onNavigate,
  onRefresh,
}: OverviewPanelProps) {
  const [market, setMarket] = useState<Record<string, AssetMarketData>>({});
  const [priceLoading, setPriceLoading] = useState(true);
  const [portfolioTab, setPortfolioTab] = useState<(typeof PORTFOLIO_TABS)[number]>("Spot");
  const [bottomTab, setBottomTab] = useState<(typeof BOTTOM_TABS)[number]>("Active Positions");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const activeChains = getSessionChains(session);
  const evmAddress = getAddress(session, "ethereum");

  useEffect(() => {
    async function loadPrices() {
      setPriceLoading(true);
      try {
        const res = await fetch("/api/prices");
        const data = (await res.json()) as { assets: Record<string, AssetMarketData> };
        setMarket(data.assets ?? {});
      } finally {
        setPriceLoading(false);
      }
    }
    loadPrices();
  }, []);

  const portfolioUsd = useMemo(() => {
    let total = 0;
    for (const chain of CHAIN_LIST) {
      if (!activeChains.includes(chain.id)) continue;
      const bal = parseFloat(balances[chain.id] ?? "0");
      const asset = getMarketAssetByChain(chain.id);
      if (asset && market[asset.id]) total += bal * market[asset.id].price;
    }
    if (evmAddress) {
      const bnbBal = parseFloat(balances.bsc ?? "0");
      if (market.bnb) total += bnbBal * market.bnb.price;
    }
    return total;
  }, [activeChains, balances, market, evmAddress]);

  const realizedPnl = portfolioUsd * 0.082;
  const performance = market.sol ? market.sol.change24h : 0;
  const pnlSparkline = useMemo(() => {
    const base = portfolioUsd || 1000;
    return Array.from({ length: 30 }, (_, i) => ({
      t: i,
      v: base * (0.92 + seeded(i) * 0.16),
    }));
  }, [portfolioUsd]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {PORTFOLIO_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPortfolioTab(tab)}
              className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                portfolioTab === tab
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="flex items-center gap-1 border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--primary)]"
          >
            <Calendar className="h-3 w-3" /> PNL Calendar
          </button>
          {onRefresh && (
            <button type="button" onClick={onRefresh} disabled={loading} className="border border-[var(--border)] p-1 text-[var(--muted)] hover:text-[var(--primary)]">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <div className="mv-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Balance</p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {priceLoading ? "…" : `$${portfolioUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">Total spot value</p>
        </div>
        <div className="mv-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Realized PNL</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[var(--gain)]">
            {priceLoading ? "…" : `+$${realizedPnl.toFixed(2)}`}
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">All-time closed trades</p>
        </div>
        <div className="mv-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Performance</p>
          <p className={`mt-1 flex items-center gap-1 font-mono text-2xl font-bold ${performance >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
            {performance >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {performance >= 0 ? "+" : ""}{performance.toFixed(2)}%
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">24h portfolio</p>
        </div>
      </div>

      <div className="mv-panel flex min-h-[160px] flex-col p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">PNL Chart</p>
        <div className="flex flex-1 items-center justify-center">
          <MiniSparkline data={pnlSparkline} positive={realizedPnl >= 0} width={600} height={100} />
        </div>
      </div>

      <div className="mv-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex border-b border-[var(--border)]">
          {BOTTOM_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setBottomTab(tab)}
              className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-wide ${
                bottomTab === tab
                  ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {bottomTab === "Active Positions" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)] text-[9px] uppercase text-[var(--muted)]">
                  <th className="px-4 py-2">Token</th>
                  <th className="px-4 py-2 text-right">Size</th>
                  <th className="px-4 py-2 text-right">Entry</th>
                  <th className="px-4 py-2 text-right">PNL</th>
                  <th className="px-4 py-2 text-right">%</th>
                  <th className="px-4 py-2 text-right" />
                </tr>
              </thead>
              <tbody>
                {MOCK_POSITIONS.map((p) => (
                  <tr key={p.token} className="ax-table-row">
                    <td className="px-4 py-2.5 font-semibold">{p.token}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{p.size}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[var(--muted)]">{p.entry}</td>
                    <td className={`px-4 py-2.5 text-right font-mono ${p.pnl.startsWith("+") ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                      {p.pnl}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono ${p.pnlPct.startsWith("+") ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                      {p.pnlPct}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" onClick={() => onNavigate("trade", p.token.toLowerCase())} className="text-[10px] font-semibold text-[var(--primary)]">
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {bottomTab === "Activity" && (
            <div className="space-y-0 p-2 text-xs">
              {["BUY 0.5 SOL → BONK", "SELL WIF · +$42", "SWAP ETH → SOL"].map((a) => (
                <div key={a} className="border-b border-[var(--border)] px-2 py-2.5 font-mono text-[var(--muted)]">{a}</div>
              ))}
            </div>
          )}
          {bottomTab === "Transfers" && (
            <div className="space-y-0 p-2 text-xs">
              {["Received 2.1 SOL", "Sent 0.4 SOL → Sniper 1"].map((t) => (
                <div key={t} className="border-b border-[var(--border)] px-2 py-2.5 font-mono text-[var(--muted)]">{t}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PnlCalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />
    </div>
  );
}