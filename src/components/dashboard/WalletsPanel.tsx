"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GripVertical, History, Plus } from "lucide-react";

type WalletSlot = {
  id: string;
  label: string;
  address: string;
  balance: number;
};

const INITIAL_SOURCE: WalletSlot = {
  id: "source",
  label: "Main wallet",
  address: "7xKX…9f2a",
  balance: 4.28,
};

const INITIAL_DEST: WalletSlot[] = [
  { id: "d1", label: "Sniper 1", address: "9kLm…3pQ1", balance: 0.85 },
  { id: "d2", label: "Sniper 2", address: "4nRt…8wX7", balance: 1.12 },
  { id: "d3", label: "Farm wallet", address: "2bVc…5kL9", balance: 0.42 },
];

export function WalletsPanel() {
  const [source, setSource] = useState(INITIAL_SOURCE);
  const [destinations, setDestinations] = useState(INITIAL_DEST);
  const [dragId, setDragId] = useState<string | null>(null);
  const [amount, setAmount] = useState("0.5");
  const [note, setNote] = useState<string | null>(null);

  function handleDropOnDest(destId: string) {
    if (!dragId || dragId === destId) return;
    const amt = parseFloat(amount) || 0;
    if (amt <= 0 || amt > source.balance) {
      setNote("Invalid amount");
      return;
    }
    setSource((s) => ({ ...s, balance: +(s.balance - amt).toFixed(4) }));
    setDestinations((ds) =>
      ds.map((d) => (d.id === destId ? { ...d, balance: +(d.balance + amt).toFixed(4) } : d)),
    );
    setNote(`Distributed ${amt} SOL → ${destinations.find((d) => d.id === destId)?.label}`);
    setDragId(null);
  }

  function WalletCard({
    wallet,
    draggable,
    onDrop,
  }: {
    wallet: WalletSlot;
    draggable?: boolean;
    onDrop?: () => void;
  }) {
    return (
      <div
        draggable={draggable}
        onDragStart={() => draggable && setDragId(wallet.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop?.()}
        className={`flex items-center gap-2 border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2.5 transition ${
          onDrop ? "hover:border-[var(--primary)]" : ""
        }`}
      >
        {draggable && <GripVertical className="h-4 w-4 shrink-0 text-[var(--muted-dim)]" />}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold">{wallet.label}</p>
          <p className="font-mono text-[9px] text-[var(--muted)]">{wallet.address}</p>
        </div>
        <span className="font-mono text-sm font-semibold text-[var(--foreground)]">{wallet.balance} SOL</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-semibold">Wallets</h1>
          <p className="text-[11px] text-[var(--muted)]">Drag source SOL to destination wallets</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="flex items-center gap-1 border border-[var(--border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">
            <History className="h-3 w-3" /> History
          </button>
          <Button size="sm" className="flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Create
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-[10px] font-semibold uppercase text-[var(--muted)]">Amount</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mv-input w-24 font-mono text-xs"
          type="number"
          step="0.01"
          min="0"
        />
        <span className="text-[10px] text-[var(--muted)]">SOL per drop</span>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <div className="mv-panel flex flex-col p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Source</p>
          <WalletCard wallet={source} draggable />
          <p className="mt-3 text-[10px] text-[var(--muted-dim)]">Drag to a destination wallet below</p>
        </div>

        <div className="mv-panel flex flex-col p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Destination</p>
          <div className="space-y-2 overflow-y-auto">
            {destinations.map((d) => (
              <WalletCard key={d.id} wallet={d} onDrop={() => handleDropOnDest(d.id)} />
            ))}
          </div>
        </div>
      </div>

      {note && <p className="mv-alert-info text-xs">{note}</p>}
      <p className="text-[10px] text-[var(--muted-dim)]">
        Simulated distribution · on-chain transfers require wallet unlock via Send tab
      </p>
    </div>
  );
}