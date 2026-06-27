"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardTab } from "@/components/dashboard/ActionTabs";
import { WalletsPanel } from "@/components/dashboard/WalletsPanel";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { PnlCalendarModal } from "@/components/dashboard/PnlCalendarModal";
import type { AssetMarketData } from "@/app/api/prices/route";
import { getMarketAssetByChain } from "@/lib/market/assets";
import { CHAIN_LIST } from "@/lib/wallet/chains";
import { ChainBalances } from "@/lib/wallet/balances-client";
import { getAddress, getSessionChains, SessionData } from "@/lib/wallet/session";
import { loadSnapshots, recordSnapshot } from "@/lib/platform/portfolio-snapshots";
import { Calendar, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";

type OverviewPanelProps = {
  session: SessionData;
  balances: ChainBalances;
  loading?: boolean;
  onNavigate: (tab: DashboardTab, asset?: string) => void;
  onRefresh?: () => void;
  onSessionChange?: (session: SessionData) => void;
  initialWalletsTab?: boolean;
  showWalletWelcome?: boolean;
};

const PORTFOLIO_TABS = ["Spot", "Wallets"] as const;
const BOTTOM_TABS = ["Holdings", "Activity", "Transfers"] as const;

export function OverviewPanel({
  session,
  balances,
  loading,
  onNavigate,
  onRefresh,
  onSessionChange,
  initialWalletsTab,
  showWalletWelcome,
}: OverviewPanelProps) {
  const [market, setMarket] = useState<Record<string, AssetMarketData>>({});
  const [priceLoading, setPriceLoading] = useState(true);
  const [portfolioTab, setPortfolioTab] = useState<(typeof PORTFOLIO_TABS)[number]>(
    initialWalletsTab ? "Wallets" : "Spot",
  );
  const [bottomTab, setBottomTab] = useState<(typeof BOTTOM_TABS)[number]>("Holdings");
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

  const holdings = useMemo(() => {
    const rows: { symbol: string; chain: string; balance: number; usd: number; change24h: number; assetId: string }[] = [];
    for (const chain of CHAIN_LIST) {
      if (!activeChains.includes(chain.id)) continue;
      const bal = parseFloat(balances[chain.id] ?? "0");
      if (bal <= 0) continue;
      const asset = getMarketAssetByChain(chain.id);
      if (!asset || !market[asset.id]) continue;
      rows.push({
        symbol: chain.symbol,
        chain: chain.name,
        balance: bal,
        usd: bal * market[asset.id].price,
        change24h: market[asset.id].change24h,
        assetId: asset.id,
      });
    }
    if (evmAddress) {
      const bnbBal = parseFloat(balances.bsc ?? "0");
      if (bnbBal > 0 && market.bnb) {
        rows.push({
          symbol: "BNB",
          chain: "BNB Chain",
          balance: bnbBal,
          usd: bnbBal * market.bnb.price,
          change24h: market.bnb.change24h,
          assetId: "bnb",
        });
      }
    }
    return rows.sort((a, b) => b.usd - a.usd);
  }, [activeChains, balances, market, evmAddress]);

  const portfolioUsd = useMemo(
    () => holdings.reduce((sum, h) => sum + h.usd, 0),
    [holdings],
  );

  useEffect(() => {
    if (portfolioUsd > 0) recordSnapshot(portfolioUsd);
  }, [portfolioUsd]);

  const performance = useMemo(() => {
    if (portfolioUsd <= 0) return 0;
    let weighted = 0;
    for (const h of holdings) {
      weighted += (h.usd / portfolioUsd) * h.change24h;
    }
    return weighted;
  }, [holdings, portfolioUsd]);

  const snapshots = loadSnapshots();
  const pnlSparkline = useMemo(
    () => snapshots.map((s, i) => ({ t: i, v: s.usd })),
    [snapshots.length, portfolioUsd],
  );

  const dailyChange = useMemo(() => {
    if (snapshots.length < 2) return null;
    const prev = snapshots[snapshots.length - 2]?.usd;
    const last = snapshots[snapshots.length - 1]?.usd;
    if (prev == null || last == null) return null;
    return last - prev;
  }, [snapshots]);

  if (portfolioTab === "Wallets") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="flex gap-1 border-b border-[var(--border)]">
          {PORTFOLIO_TABS.map((tab) => (
            <button key={tab} type="button" onClick={() => setPortfolioTab(tab)} className={`px-4 py-2 text-[11px] font-semibold ${portfolioTab === tab ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
              {tab}
            </button>
          ))}
        </div>
        <WalletsPanel
          session={session}
          onNavigate={onNavigate}
          onRefresh={onRefresh}
          onSessionChange={onSessionChange}
          welcome={showWalletWelcome}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 border-b border-[var(--border)]">
          {PORTFOLIO_TABS.map((tab) => (
            <button key={tab} type="button" onClick={() => setPortfolioTab(tab)} className={`px-4 py-2 text-[11px] font-semibold ${portfolioTab === tab ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCalendarOpen(true)} className="flex items-center gap-1 border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--primary)]">
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
            {priceLoading || loading ? "…" : `$${portfolioUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">Live mainnet balances · CoinGecko USD</p>
        </div>
        <div className="mv-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">24h Change</p>
          <p className={`mt-1 font-mono text-2xl font-bold ${(dailyChange ?? 0) >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
            {dailyChange === null ? "—" : `${dailyChange >= 0 ? "+" : ""}$${dailyChange.toFixed(2)}`}
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">From recorded daily snapshots</p>
        </div>
        <div className="mv-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Performance</p>
          <p className={`mt-1 flex items-center gap-1 font-mono text-2xl font-bold ${performance >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
            {performance >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {performance >= 0 ? "+" : ""}{performance.toFixed(2)}%
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">Weighted 24h (holdings)</p>
        </div>
      </div>

      <div className="mv-panel flex min-h-[160px] flex-col p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Portfolio Value History</p>
        <div className="flex flex-1 items-center justify-center">
          {pnlSparkline.length >= 2 ? (
            <MiniSparkline data={pnlSparkline} positive={portfolioUsd >= (snapshots[0]?.usd ?? 0)} width={600} height={100} />
          ) : (
            <p className="text-[11px] text-[var(--muted)]">Visit daily to record real portfolio snapshots</p>
          )}
        </div>
      </div>

      <div className="mv-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex border-b border-[var(--border)]">
          {BOTTOM_TABS.map((tab) => (
            <button key={tab} type="button" onClick={() => setBottomTab(tab)} className={`px-4 py-2 text-[10px] font-semibold uppercase ${bottomTab === tab ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto">
          {bottomTab === "Holdings" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)] text-[9px] uppercase text-[var(--muted)]">
                  <th className="px-4 py-2">Asset</th>
                  <th className="px-4 py-2 text-right">Balance</th>
                  <th className="px-4 py-2 text-right">USD</th>
                  <th className="px-4 py-2 text-right">24h</th>
                  <th className="px-4 py-2 text-right" />
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.symbol} className="ax-table-row">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold">{h.symbol}</p>
                      <p className="text-[10px] text-[var(--muted)]">{h.chain}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{h.balance}</td>
                    <td className="px-4 py-2.5 text-right font-mono">${h.usd.toFixed(2)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono ${h.change24h >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                      {h.change24h >= 0 ? "+" : ""}{h.change24h.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" onClick={() => onNavigate("trade", h.assetId)} className="text-[10px] font-semibold text-[var(--primary)]">Trade</button>
                    </td>
                  </tr>
                ))}
                {!holdings.length && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">No non-zero balances on connected chains</td></tr>
                )}
              </tbody>
            </table>
          )}
          {bottomTab === "Activity" && (
            <p className="px-4 py-8 text-center text-xs text-[var(--muted)]">On-chain activity feed requires indexer — no simulated trades shown</p>
          )}
          {bottomTab === "Transfers" && (
            <p className="px-4 py-8 text-center text-xs text-[var(--muted)]">Use Portfolio → Wallets to send, receive, and distribute funds</p>
          )}
        </div>
      </div>

      <PnlCalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />
    </div>
  );
}