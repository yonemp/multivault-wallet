"use client";

import { useState, type ReactNode } from "react";
import { GripVertical, Star } from "lucide-react";

export type WalletCardData = {
  id: string;
  label: string;
  address: string;
  balance: number;
  holdings: number;
  color: string;
  isActive?: boolean;
};

type WalletDragCardProps = {
  wallet: WalletCardData;
  onSetActive?: () => void;
  compact?: boolean;
};

function truncate(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function WalletDragCard({ wallet, onSetActive, compact }: WalletDragCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("walletId", wallet.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`group flex cursor-grab items-center gap-2 border border-[var(--border)] bg-[var(--surface-solid)] transition hover:border-[var(--primary)]/50 hover:bg-[var(--surface-hover)] active:cursor-grabbing ${
        compact ? "px-2 py-1.5" : "px-3 py-2.5"
      } ${wallet.isActive ? "ring-1 ring-[var(--primary)]/40" : ""}`}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-[var(--muted-dim)] opacity-40 group-hover:opacity-100" />
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center text-[10px] font-bold"
        style={{ background: `${wallet.color}22`, border: `1px solid ${wallet.color}55`, color: wallet.color }}
      >
        {wallet.label.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-[11px] font-semibold" style={{ color: wallet.color }}>
            {wallet.label}
          </p>
          {wallet.isActive && (
            <span className="rounded bg-[var(--primary-soft)] px-1 text-[8px] font-bold text-[var(--primary)]">ACTIVE</span>
          )}
        </div>
        <p className="font-mono text-[9px] text-[var(--muted)]">{truncate(wallet.address)}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-[11px] font-semibold">{wallet.balance.toFixed(3)}</p>
        <p className="text-[8px] text-[var(--muted)]">SOL</p>
      </div>
      {onSetActive && !wallet.isActive && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSetActive(); }}
          title="Set as active trading wallet"
          className="shrink-0 border border-[var(--border)] p-1 text-[var(--muted)] opacity-0 transition hover:text-[var(--primary)] group-hover:opacity-100"
        >
          <Star className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

type DropZoneProps = {
  zone: "active" | "source" | "dest";
  label: string;
  hint: string;
  walletIds: string[];
  walletMap: Map<string, WalletCardData>;
  onDrop: (walletId: string, zone: "active" | "source" | "dest") => void;
  onSetActive?: (id: string) => void;
  activeWalletId?: string | null;
  headerRight?: ReactNode;
  showFund?: boolean;
  onFund?: (id: string) => void;
};

export function WalletDropZone({
  zone,
  label,
  hint,
  walletIds,
  walletMap,
  onDrop,
  onSetActive,
  activeWalletId,
  headerRight,
  showFund,
  onFund,
}: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <span className="text-[11px] font-semibold">{label}</span>
        {headerRight}
      </div>
      <div
        className={`flex flex-1 flex-col gap-1.5 overflow-y-auto p-2 transition ${
          dragOver ? "bg-[var(--primary-soft)]/30 ring-1 ring-inset ring-[var(--primary)]/40" : ""
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const id = e.dataTransfer.getData("walletId");
          if (id) onDrop(id, zone);
        }}
      >
        {walletIds.map((id) => {
          const w = walletMap.get(id);
          if (!w) return null;
          return (
            <div key={id} className="relative">
              <WalletDragCard
                wallet={{ ...w, isActive: id === activeWalletId }}
                onSetActive={onSetActive ? () => onSetActive(id) : undefined}
                compact={zone !== "active"}
              />
              {showFund && onFund && (
                <button
                  type="button"
                  onClick={() => onFund(id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 border border-[var(--primary)] bg-[var(--surface-solid)] px-2 py-0.5 text-[8px] font-bold text-[var(--primary)]"
                >
                  Fund
                </button>
              )}
            </div>
          );
        })}
        {walletIds.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <p className="text-[10px] text-[var(--muted-dim)]">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}