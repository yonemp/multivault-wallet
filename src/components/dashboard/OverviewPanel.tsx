import { Wallet } from "lucide-react";
import { SessionData } from "@/lib/wallet/session";

type Balances = {
  eth?: string;
  matic?: string;
  bnb?: string;
  sol?: string;
};

type OverviewPanelProps = {
  session: SessionData;
  balances: Balances;
};

export function OverviewPanel({ session, balances }: OverviewPanelProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {session.evmAddress && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-violet-300" />
            <h2 className="text-lg font-semibold text-white">EVM Wallet</h2>
          </div>
          <p className="mt-4 break-all font-mono text-sm text-zinc-300">
            {session.evmAddress}
          </p>
          <div className="mt-6 space-y-2 text-sm text-zinc-400">
            <p>Ethereum: {balances.eth ?? "..."} ETH</p>
            <p>Polygon: {balances.matic ?? "..."} MATIC</p>
            <p>BNB Chain: {balances.bnb ?? "..."} BNB</p>
          </div>
        </section>
      )}

      {session.solanaAddress && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-purple-300" />
            <h2 className="text-lg font-semibold text-white">Solana Wallet</h2>
          </div>
          <p className="mt-4 break-all font-mono text-sm text-zinc-300">
            {session.solanaAddress}
          </p>
          <div className="mt-6 text-sm text-zinc-400">
            <p>Solana: {balances.sol ?? "..."} SOL</p>
          </div>
        </section>
      )}
    </div>
  );
}