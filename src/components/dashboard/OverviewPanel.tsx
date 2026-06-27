"use client";

import { Card } from "@/components/ui/Card";
import { DashboardTab } from "@/components/dashboard/ActionTabs";
import { SessionData } from "@/lib/wallet/session";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

type Balances = {
  eth?: string;
  matic?: string;
  bnb?: string;
  sol?: string;
};

type OverviewPanelProps = {
  session: SessionData;
  balances: Balances;
  onNavigate: (tab: DashboardTab) => void;
};

const quickActions = [
  { id: "send" as const, label: "Send", icon: ArrowUpRight, color: "bg-blue-600" },
  { id: "receive" as const, label: "Receive", icon: ArrowDownLeft, color: "bg-sky-500" },
  { id: "swap" as const, label: "Swap", icon: ArrowLeftRight, color: "bg-indigo-500" },
];

export function OverviewPanel({ session, balances, onNavigate }: OverviewPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyAddress(address: string, key: string) {
    await navigator.clipboard.writeText(address);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const chainBalances = [
    session.evmAddress && {
      key: "eth",
      name: "Ethereum",
      symbol: "ETH",
      balance: balances.eth,
      color: "from-blue-500 to-blue-600",
    },
    session.evmAddress && {
      key: "matic",
      name: "Polygon",
      symbol: "MATIC",
      balance: balances.matic,
      color: "from-violet-500 to-purple-600",
    },
    session.evmAddress && {
      key: "bnb",
      name: "BNB Chain",
      symbol: "BNB",
      balance: balances.bnb,
      color: "from-amber-400 to-orange-500",
    },
    session.solanaAddress && {
      key: "sol",
      name: "Solana",
      symbol: "SOL",
      balance: balances.sol,
      color: "from-fuchsia-500 to-purple-600",
    },
  ].filter(Boolean) as {
    key: string;
    name: string;
    symbol: string;
    balance?: string;
    color: string;
  }[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p className="mt-2 text-slate-500">
          Manage your assets across Ethereum, Polygon, BNB Chain, and Solana.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {quickActions.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} text-white shadow-lg transition group-hover:scale-105`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-700">{label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {chainBalances.map((chain) => (
          <Card
            key={chain.key}
            className="relative overflow-hidden transition hover:shadow-md"
          >
            <div
              className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br ${chain.color} opacity-10`}
            />
            <p className="text-sm font-medium text-slate-500">{chain.name}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {chain.balance ?? "..."}{" "}
              <span className="text-lg font-semibold text-slate-400">
                {chain.symbol}
              </span>
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {session.evmAddress && (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">EVM address</h2>
              <button
                type="button"
                onClick={() => copyAddress(session.evmAddress!, "evm")}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                {copied === "evm" ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <p className="break-all rounded-xl bg-slate-50 px-4 py-3 font-mono text-xs text-slate-600">
              {session.evmAddress}
            </p>
          </Card>
        )}

        {session.solanaAddress && (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Solana address</h2>
              <button
                type="button"
                onClick={() => copyAddress(session.solanaAddress!, "sol")}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                {copied === "sol" ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <p className="break-all rounded-xl bg-slate-50 px-4 py-3 font-mono text-xs text-slate-600">
              {session.solanaAddress}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}