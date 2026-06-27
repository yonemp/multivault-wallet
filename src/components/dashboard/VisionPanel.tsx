"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  addWatchedWallet,
  loadWatchedWallets,
  removeWatchedWallet,
  WatchedWallet,
} from "@/lib/platform/watched-wallets";
import { Eye, Trash2 } from "lucide-react";

export function VisionPanel() {
  const [wallets, setWallets] = useState<WatchedWallet[]>([]);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [chain, setChain] = useState<"solana" | "ethereum">("solana");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setWallets(loadWatchedWallets());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleAdd() {
    setError(null);
    try {
      if (!address.trim()) throw new Error("Enter wallet address");
      addWatchedWallet({ address: address.trim(), label: label.trim() || "Tracked wallet", chain });
      setAddress("");
      setLabel("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Vision"
        description="Track top wallets — entry/exit points, positions, and performance"
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="mv-panel grid gap-2 p-3 sm:grid-cols-3">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Wallet address" />
          <div className="flex gap-2">
            {(["solana", "ethereum"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChain(c)}
                className={`flex-1 border py-2 text-[10px] font-semibold uppercase ${
                  chain === c ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {c === "solana" ? "SOL" : "EVM"}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleAdd}>Add wallet</Button>
      </div>
      {error && <p className="mv-alert-error mb-3 text-xs">{error}</p>}

      <div className="mv-panel flex-1 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)] text-[10px] uppercase text-[var(--muted)]">
              <th className="px-3 py-2">Wallet</th>
              <th className="px-3 py-2">Chain</th>
              <th className="px-3 py-2 text-right">PnL</th>
              <th className="px-3 py-2 text-right">Win rate</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) => (
              <tr key={w.id} className="ax-table-row">
                <td className="px-3 py-2.5">
                  <p className="font-semibold">{w.label}</p>
                  <p className="font-mono text-[10px] text-[var(--muted)]">{w.address}</p>
                </td>
                <td className="px-3 py-2.5 uppercase">{w.chain}</td>
                <td className="px-3 py-2.5 text-right font-mono text-[var(--gain)]">{w.pnl}</td>
                <td className="px-3 py-2.5 text-right font-mono">{w.winRate}%</td>
                <td className="px-3 py-2.5 text-right">
                  <button type="button" onClick={() => { removeWatchedWallet(w.id); refresh(); }} className="text-[var(--muted)] hover:text-[var(--loss)]">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {!wallets.length && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[var(--muted)]">
                  <Eye className="mx-auto mb-2 h-5 w-5 opacity-50" />
                  Add wallets to mimic high-performing traders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}