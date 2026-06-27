"use client";

import { DashboardTab } from "@/components/dashboard/ActionTabs";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import type { AssetMarketData } from "@/app/api/prices/route";
import { getMarketAssetByChain } from "@/lib/market/assets";
import { CHAIN_LIST, ChainId } from "@/lib/wallet/chains";
import { ChainBalances } from "@/lib/wallet/balances-client";
import { getAddress, getSessionChains, SessionData } from "@/lib/wallet/session";
import { Check, Copy, ExternalLink, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type OverviewPanelProps = {
  session: SessionData;
  balances: ChainBalances;
  loading?: boolean;
  onNavigate: (tab: DashboardTab, asset?: string) => void;
  onRefresh?: () => void;
};

function truncateAddress(address: string) {
  if (address.length <= 16) return address;
  return `${address.slice(0, 10)}…${address.slice(-8)}`;
}

function formatWalletType(type: SessionData["walletType"]) {
  const labels: Record<SessionData["walletType"], string> = {
    created: "Created wallet",
    imported: "Imported wallet",
    metamask: "MetaMask",
    phantom: "Phantom",
    trust: "Trust Wallet",
  };
  return labels[type];
}

function capabilityLabel(send: boolean, swap: boolean) {
  const parts: string[] = [];
  if (send) parts.push("Send");
  if (swap) parts.push("Swap");
  if (parts.length === 0) parts.push("Receive only");
  return parts.join(" · ");
}

const BNB_ROW = {
  id: "bsc" as const,
  symbol: "BNB",
  name: "BNB Chain",
  color: "#F0B90B",
  family: "evm",
  canSend: true,
  canSwap: true,
};

export function OverviewPanel({
  session,
  balances,
  loading,
  onNavigate,
  onRefresh,
}: OverviewPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [market, setMarket] = useState<Record<string, AssetMarketData>>({});
  const [priceLoading, setPriceLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"24h" | "4h">("24h");
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
      if (asset && market[asset.id]) {
        total += bal * market[asset.id].price;
      }
    }
    if (evmAddress) {
      const bnbBal = parseFloat(balances.bsc ?? "0");
      if (market.bnb) total += bnbBal * market.bnb.price;
    }
    return total;
  }, [activeChains, balances, market, evmAddress]);

  const stats = useMemo(() => {
    const withBalance = CHAIN_LIST.filter(
      (c) => activeChains.includes(c.id) && balances[c.id] && balances[c.id] !== "0",
    ).length;

    return {
      connected: activeChains.length + (evmAddress ? 1 : 0),
      withBalance,
      mode: session.mode === "local" ? "Self-custody" : "Extension",
      type: formatWalletType(session.walletType),
    };
  }, [activeChains, balances, session, evmAddress]);

  async function copyAddress(key: string, address: string) {
    await navigator.clipboard.writeText(address);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function renderChange(assetId: string) {
    const m = market[assetId];
    if (!m) return <span className="text-[var(--muted)]">—</span>;
    const change = timeframe === "24h" ? m.change24h : m.change4h;
    const positive = change >= 0;
    return (
      <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-semibold ${positive ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {positive ? "+" : ""}
        {change.toFixed(2)}%
      </span>
    );
  }

  function renderSparkline(assetId: string) {
    const m = market[assetId];
    if (!m) return null;
    const data = timeframe === "24h" ? m.sparkline24h : m.sparkline4h;
    const change = timeframe === "24h" ? m.change24h : m.change4h;
    return <MiniSparkline data={data} positive={change >= 0} />;
  }

  return (
    <div className="space-y-4">
      <div className="mv-hero-card flex flex-wrap items-end justify-between gap-4 p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            Total portfolio value
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-[var(--foreground)]">
            {priceLoading ? "…" : `$${portfolioUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {stats.type} · {stats.mode}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-[var(--border)]">
            {(["24h", "4h"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                  timeframe === tf
                    ? "bg-[var(--foreground)] text-white"
                    : "bg-[var(--surface-solid)] text-[var(--muted)]"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          {(["discover", "trade", "send", "receive", "swap"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onNavigate(tab)}
              className="border border-[var(--border-strong)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border border-[var(--border)] bg-[var(--border)] lg:grid-cols-4">
        {[
          { label: "Connected assets", value: String(stats.connected) },
          { label: "Non-zero balances", value: String(stats.withBalance) },
          { label: "Custody mode", value: stats.mode },
          { label: "Wallet source", value: stats.type },
        ].map((item) => (
          <div key={item.label} className="mv-stat-tile px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mv-panel shadow-[var(--shadow-md)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Asset registry</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">
              {loading || priceLoading ? "Syncing…" : "Live mainnet · USD pricing"}
            </span>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="border border-[var(--border)] p-1 text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50"
                title="Refresh balances"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)] text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
                <th className="px-4 py-2.5">Asset</th>
                <th className="px-4 py-2.5">Network</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
                <th className="px-4 py-2.5 text-right">USD value</th>
                <th className="px-4 py-2.5 text-center">{timeframe}</th>
                <th className="px-4 py-2.5 text-center">Chart</th>
                <th className="px-4 py-2.5">Address</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {CHAIN_LIST.map((chain) => {
                const address = getAddress(session, chain.id);
                const connected = activeChains.includes(chain.id);
                const balance = balances[chain.id];
                const isMonero = chain.id === "monero";
                const marketAsset = getMarketAssetByChain(chain.id);
                const usd =
                  marketAsset && market[marketAsset.id] && balance
                    ? parseFloat(balance) * market[marketAsset.id].price
                    : 0;

                return (
                  <tr
                    key={chain.id}
                    className="border-b border-[var(--border)] last:border-0 transition hover:bg-[var(--surface-hover)]"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => marketAsset && onNavigate("trade", marketAsset.id)}
                        className="flex items-center gap-2 text-left"
                      >
                        <span
                          className="flex h-7 w-7 items-center justify-center text-xs font-semibold"
                          style={{
                            borderColor: chain.color,
                            color: chain.color,
                            backgroundColor: `${chain.color}10`,
                            border: `1px solid ${chain.color}40`,
                          }}
                        >
                          {chain.symbol.slice(0, 3)}
                        </span>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{chain.symbol}</p>
                          <p className="text-xs text-[var(--muted)]">{chain.name}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{chain.family.toUpperCase()}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {isMonero ? "—" : loading && connected ? (
                        <span className="inline-block h-4 w-16 animate-pulse bg-[var(--surface-active)]" />
                      ) : connected ? (
                        `${balance ?? "0"} ${chain.symbol}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                      {connected && usd > 0 ? `$${usd.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {marketAsset ? renderChange(marketAsset.id) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        {marketAsset ? renderSparkline(marketAsset.id) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                      {address ? truncateAddress(address) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {address && (
                          <button
                            type="button"
                            onClick={() => copyAddress(chain.id, address)}
                            className="border border-[var(--border)] p-1.5 text-[var(--muted)] hover:text-[var(--foreground)]"
                          >
                            {copied === chain.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        {connected && !isMonero && marketAsset && (
                          <button
                            type="button"
                            onClick={() => onNavigate("trade", marketAsset.id)}
                            className="border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]"
                          >
                            Trade
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {evmAddress && (
                <tr className="border-b border-[var(--border)] transition hover:bg-[var(--surface-hover)]">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onNavigate("trade", "bnb")} className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center border text-xs font-semibold" style={{ borderColor: BNB_ROW.color, color: BNB_ROW.color, backgroundColor: `${BNB_ROW.color}10` }}>
                        BNB
                      </span>
                      <div>
                        <p className="font-medium">{BNB_ROW.symbol}</p>
                        <p className="text-xs text-[var(--muted)]">{BNB_ROW.name}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">EVM</td>
                  <td className="px-4 py-3 text-right font-mono">{balances.bsc ?? "0"} BNB</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {market.bnb ? `$${(parseFloat(balances.bsc ?? "0") * market.bnb.price).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">{renderChange("bnb")}</td>
                  <td className="px-4 py-3"><div className="flex justify-center">{renderSparkline("bnb")}</div></td>
                  <td className="px-4 py-3 font-mono text-xs">{truncateAddress(evmAddress)}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => onNavigate("trade", "bnb")} className="border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase text-[var(--primary)]">
                      Trade
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}