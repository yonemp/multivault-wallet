"use client";

import { DashboardTab } from "@/components/dashboard/ActionTabs";
import { CHAIN_LIST, ChainId } from "@/lib/wallet/chains";
import { ChainBalances } from "@/lib/wallet/balances";
import { getAddress, getSessionChains, SessionData } from "@/lib/wallet/session";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

type OverviewPanelProps = {
  session: SessionData;
  balances: ChainBalances;
  loading?: boolean;
  onNavigate: (tab: DashboardTab) => void;
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

export function OverviewPanel({
  session,
  balances,
  loading,
  onNavigate,
}: OverviewPanelProps) {
  const [copied, setCopied] = useState<ChainId | null>(null);
  const activeChains = getSessionChains(session);

  const stats = useMemo(() => {
    const withBalance = CHAIN_LIST.filter(
      (c) => activeChains.includes(c.id) && balances[c.id] && balances[c.id] !== "0",
    ).length;

    return {
      connected: activeChains.length,
      withBalance,
      mode: session.mode === "local" ? "Self-custody" : "Extension",
      type: formatWalletType(session.walletType),
    };
  }, [activeChains, balances, session]);

  async function copyAddress(chain: ChainId) {
    const addr = getAddress(session, chain);
    if (!addr) return;
    await navigator.clipboard.writeText(addr);
    setCopied(chain);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Portfolio overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Balances, addresses, and capabilities across all supported networks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["send", "receive", "swap"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onNavigate(tab)}
              className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border border-slate-200 bg-slate-200 lg:grid-cols-4">
        {[
          { label: "Connected assets", value: String(stats.connected) },
          { label: "Non-zero balances", value: String(stats.withBalance) },
          { label: "Custody mode", value: stats.mode },
          { label: "Wallet source", value: stats.type },
        ].map((item) => (
          <div key={item.label} className="bg-white px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Asset registry</h2>
          <span className="text-xs text-slate-500">
            {loading ? "Refreshing balances…" : "Live mainnet balances"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5">Asset</th>
                <th className="px-4 py-2.5">Network</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
                <th className="px-4 py-2.5">Address</th>
                <th className="px-4 py-2.5">Capabilities</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {CHAIN_LIST.map((chain) => {
                const address = getAddress(session, chain.id);
                const connected = activeChains.includes(chain.id);
                const balance = balances[chain.id];
                const isMonero = chain.id === "monero";

                let status = "Inactive";
                if (isMonero) status = "External wallet required";
                else if (connected) status = "Active";
                else if (session.mode === "local") status = "Derive on unlock";

                return (
                  <tr
                    key={chain.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 items-center justify-center border text-xs font-semibold"
                          style={{
                            borderColor: chain.color,
                            color: chain.color,
                            backgroundColor: `${chain.color}10`,
                          }}
                        >
                          {chain.symbol.slice(0, 3)}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{chain.symbol}</p>
                          <p className="text-xs text-slate-500">{chain.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{chain.family.toUpperCase()}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900">
                      {isMonero ? (
                        <span className="text-slate-400">—</span>
                      ) : loading && connected ? (
                        <span className="inline-block h-4 w-16 animate-pulse bg-slate-100" />
                      ) : connected ? (
                        `${balance ?? "0"} ${chain.symbol}`
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {address ? truncateAddress(address) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {isMonero
                        ? "Privacy chain"
                        : capabilityLabel(chain.canSend, chain.canSwap)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                          status === "Active"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : status === "Inactive"
                              ? "border-slate-200 bg-slate-50 text-slate-500"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {address && (
                          <button
                            type="button"
                            onClick={() => copyAddress(chain.id)}
                            className="border border-slate-200 p-1.5 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                            title="Copy address"
                          >
                            {copied === chain.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        {connected && !isMonero && (
                          <button
                            type="button"
                            onClick={() => onNavigate("receive")}
                            className="border border-slate-200 p-1.5 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                            title="Receive"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-px border border-slate-200 bg-slate-200 lg:grid-cols-2">
        <section className="bg-white px-4 py-3">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Session
          </h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Mode</dt>
              <dd className="font-medium text-slate-900">{stats.mode}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Provider</dt>
              <dd className="font-medium text-slate-900">{stats.type}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Networks tracked</dt>
              <dd className="font-medium text-slate-900">{CHAIN_LIST.length}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-white px-4 py-3">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Primary addresses
          </h3>
          <dl className="mt-2 space-y-2 text-xs">
            {activeChains.slice(0, 4).map((chainId) => {
              const chain = CHAIN_LIST.find((c) => c.id === chainId)!;
              const addr = getAddress(session, chainId);
              return (
                <div key={chainId}>
                  <dt className="font-medium text-slate-600">{chain.symbol}</dt>
                  <dd className="mt-0.5 break-all font-mono text-slate-800">{addr}</dd>
                </div>
              );
            })}
            {activeChains.length > 4 && (
              <p className="text-slate-500">+{activeChains.length - 4} more in table above</p>
            )}
            {activeChains.length === 0 && (
              <p className="text-slate-500">Unlock or connect a wallet to view addresses.</p>
            )}
          </dl>
        </section>
      </div>
    </div>
  );
}