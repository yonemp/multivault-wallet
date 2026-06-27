"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { DashboardTab } from "@/components/dashboard/ActionTabs";
import { CHAIN_LIST, ChainId } from "@/lib/wallet/chains";
import { ChainBalances } from "@/lib/wallet/balances";
import { getAddress, getSessionChains, SessionData } from "@/lib/wallet/session";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Copy,
  Check,
  Lock,
} from "lucide-react";
import { useState } from "react";

type OverviewPanelProps = {
  session: SessionData;
  balances: ChainBalances;
  loading?: boolean;
  onNavigate: (tab: DashboardTab) => void;
};

const quickActions = [
  { id: "send" as const, label: "Send", icon: ArrowUpRight, color: "bg-blue-600" },
  { id: "receive" as const, label: "Receive", icon: ArrowDownLeft, color: "bg-sky-500" },
  { id: "swap" as const, label: "Swap", icon: ArrowLeftRight, color: "bg-indigo-500" },
];

export function OverviewPanel({
  session,
  balances,
  loading,
  onNavigate,
}: OverviewPanelProps) {
  const [copied, setCopied] = useState<ChainId | null>(null);
  const activeChains = getSessionChains(session);

  async function copyAddress(chain: ChainId) {
    const addr = getAddress(session, chain);
    if (!addr) return;
    await navigator.clipboard.writeText(addr);
    setCopied(chain);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Multi-chain portfolio
        </h1>
        <p className="mt-2 text-slate-500">
          Bitcoin, Litecoin, Ethereum, Solana, TON, Monero & XRP — one vault.
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {quickActions.map(({ id, label, icon: Icon, color }, i) => (
          <motion.button
            key={id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            onClick={() => onNavigate(id)}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} text-white shadow-lg transition group-hover:scale-105`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-700">{label}</span>
          </motion.button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CHAIN_LIST.map((chain, i) => {
          const address = getAddress(session, chain.id);
          const hasWallet = activeChains.includes(chain.id);
          const balance = balances[chain.id];

          return (
            <motion.div
              key={chain.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <Card
                className={`relative overflow-hidden transition hover:shadow-md ${
                  !hasWallet && chain.id !== "monero" ? "opacity-60" : ""
                }`}
              >
                <div
                  className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${chain.gradient} opacity-15`}
                />
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${chain.gradient} text-lg font-bold text-white shadow-sm`}
                  >
                    {chain.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{chain.name}</p>
                    <p className="text-xs text-slate-500">{chain.symbol}</p>
                  </div>
                </div>

                {chain.id === "monero" ? (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-800">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    Privacy chain — use native Monero wallet
                  </div>
                ) : hasWallet ? (
                  <>
                    <p className="mt-4 text-2xl font-bold text-slate-900">
                      {loading ? (
                        <span className="inline-block h-7 w-20 animate-pulse rounded-lg bg-slate-100" />
                      ) : (
                        <>
                          {balance ?? "0"}{" "}
                          <span className="text-sm font-medium text-slate-400">
                            {chain.symbol}
                          </span>
                        </>
                      )}
                    </p>
                    {address && (
                      <button
                        type="button"
                        onClick={() => copyAddress(chain.id)}
                        className="mt-3 flex w-full items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        {copied === chain.id ? (
                          <>
                            <Check className="h-3 w-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy address
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">Not connected</p>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}