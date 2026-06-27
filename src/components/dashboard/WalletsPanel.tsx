"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardTab } from "@/components/dashboard/ActionTabs.types";

import { ChainBalances } from "@/lib/wallet/balances-client";
import { getAddress, SessionData } from "@/lib/wallet/session";
import {
  addManagedWallet,
  exportWalletsJson,
  importWalletsJson,
  loadManagedWallets,
  ManagedWallet,
  updateManagedWallet,
} from "@/lib/platform/wallet-manager";
import {
  ArrowDown,
  ChevronDown,
  Download,
  History,
  Plus,
  Search,
  Send,
  Upload,
  Wallet,
} from "lucide-react";

type WalletsPanelProps = {
  session: SessionData;
  balances: ChainBalances;
  onNavigate: (tab: DashboardTab) => void;
  onRefresh?: () => void;
};

function truncate(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function WalletsPanel({ session, balances, onNavigate, onRefresh }: WalletsPanelProps) {
  const [wallets, setWallets] = useState<ManagedWallet[]>([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [destIds, setDestIds] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [distAmount, setDistAmount] = useState("0.5");
  const [note, setNote] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const solAddress = getAddress(session, "solana");
  const solBalance = parseFloat(balances.solana ?? "0") || 0;

  function refresh() {
    const stored = loadManagedWallets();
    const mainId = "main-wallet";
    const main: ManagedWallet = {
      id: mainId,
      label: session.walletType === "created" ? "Main Wallet" : "Atom Main",
      address: solAddress ?? "—",
      balance: solBalance,
      holdings: Object.keys(session.addresses).length,
      color: "#f5a623",
    };
    const extras = stored.filter((w) => w.id !== mainId);
    if (solAddress) {
      setWallets([main, ...extras]);
    } else {
      setWallets(extras);
    }
  }

  useEffect(() => {
    refresh();
  }, [session, balances]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wallets.filter((w) => {
      if (!showArchived && w.archived) return false;
      if (!q) return true;
      return w.label.toLowerCase().includes(q) || w.address.toLowerCase().includes(q);
    });
  }, [wallets, search, showArchived]);

  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);

  function handleDropOn(zone: "source" | "dest") {
    if (!dragId || dragId === "main-wallet") return;
    if (zone === "source") {
      setSourceIds((prev) => (prev.includes(dragId) ? prev : [...prev, dragId]));
    } else {
      setDestIds((prev) => (prev.includes(dragId) ? prev : [...prev, dragId]));
    }
    setDragId(null);
  }

  function distributeToDest(destId: string) {
    if (!sourceIds.length) {
      setNote("Add source wallets first");
      return;
    }
    const amt = parseFloat(distAmount) || 0;
    if (amt <= 0) {
      setNote("Enter a valid amount");
      return;
    }
    const source = walletMap.get(sourceIds[0]);
    if (!source || source.balance < amt) {
      setNote("Insufficient source balance");
      return;
    }
    updateManagedWallet(sourceIds[0], { balance: +(source.balance - amt).toFixed(4) });
    const dest = walletMap.get(destId);
    if (dest) {
      updateManagedWallet(destId, { balance: +(dest.balance + amt).toFixed(4) });
    }
    refresh();
    setNote(`Distributed ${amt} SOL → ${dest?.label ?? "wallet"}`);
    onRefresh?.();
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        importWalletsJson(await file.text());
        refresh();
        setNote("Wallets imported");
      } catch {
        setNote("Invalid import file");
      }
    };
    input.click();
  }

  function handleExport() {
    const blob = new Blob([exportWalletsJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "multivault-wallets.json";
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }

  function handleCreate(label: string) {
    const addr = `sim${Date.now().toString(36)}`;
    addManagedWallet({ label, address: addr });
    refresh();
    setCreateOpen(false);
    setNote(`Created wallet "${label}"`);
  }

  function WalletTable({
    ids,
    emptyHint,
    onDrop,
    showAddDest,
  }: {
    ids: string[];
    emptyHint?: string;
    onDrop?: () => void;
    showAddDest?: boolean;
  }) {
    const rows = ids.map((id) => walletMap.get(id)).filter(Boolean) as ManagedWallet[];

    return (
      <div
        className="min-h-[120px] flex-1"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop?.()}
      >
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[9px] uppercase tracking-wider text-[var(--muted)]">
              <th className="px-3 py-2">Wallet</th>
              <th className="px-3 py-2 text-right">Balance</th>
              <th className="px-3 py-2 text-right">Holdings</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className="ax-table-row">
                <td className="px-3 py-2">
                  <p className="font-semibold" style={{ color: w.color ?? "var(--foreground)" }}>{w.label}</p>
                  <p className="font-mono text-[9px] text-[var(--muted)]">{truncate(w.address)}</p>
                </td>
                <td className="px-3 py-2 text-right font-mono">{w.balance.toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-mono text-[var(--muted)]">{w.holdings}</td>
                <td className="px-3 py-2 text-right">
                  {showAddDest && (
                    <button
                      type="button"
                      onClick={() => distributeToDest(w.id)}
                      className="text-[9px] font-semibold text-[var(--primary)] hover:underline"
                    >
                      Fund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && emptyHint && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-[var(--muted)]">
            <ArrowDown className="mb-2 h-5 w-5 opacity-40" />
            <p className="text-[11px]">{emptyHint}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-dim)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or address"
            className="mv-input w-full pl-9 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${
            showArchived ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)]"
          }`}
        >
          Show Archived
        </button>
        <button type="button" onClick={handleImport} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">
          <Upload className="mr-1 inline h-3 w-3" /> Import
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            className="flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Export <ChevronDown className="h-3 w-3" />
          </button>
          {exportOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] border border-[var(--border-strong)] bg-[var(--surface-solid)] py-1 shadow-[var(--shadow-md)]">
              <button type="button" onClick={handleExport} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] hover:bg-[var(--surface-hover)]">
                <Download className="h-3 w-3" /> JSON export
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCreateOpen((o) => !o)}
            className="flex items-center gap-1 rounded-full border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-[10px] font-semibold text-white"
          >
            Create <ChevronDown className="h-3 w-3" />
          </button>
          {createOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] border border-[var(--border-strong)] bg-[var(--surface-solid)] py-1 shadow-[var(--shadow-md)]">
              <Link href="/create" className="block px-3 py-2 text-[10px] hover:bg-[var(--surface-hover)]">New wallet</Link>
              <Link href="/import" className="block px-3 py-2 text-[10px] hover:bg-[var(--surface-hover)]">Import wallet</Link>
              <button type="button" onClick={() => handleCreate(`Wallet ${wallets.length + 1}`)} className="block w-full px-3 py-2 text-left text-[10px] hover:bg-[var(--surface-hover)]">
                Quick create (local)
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setHistoryOpen((o) => !o)}
          className="ml-auto flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)]"
        >
          <History className="h-3 w-3" /> History
        </button>
      </div>

      {historyOpen && (
        <div className="mv-panel p-3 text-[10px] text-[var(--muted)]">
          Distribution history · on-chain transfers appear after Send is used
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[1fr_1.2fr]">
        {/* Left — Wallets list */}
        <div className="mv-panel flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-[var(--border)] px-3 py-2 text-[11px] font-semibold">Wallets</div>
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)] text-[9px] uppercase tracking-wider text-[var(--muted)]">
                <th className="px-3 py-2">Wallet</th>
                <th className="px-3 py-2 text-right">Balance</th>
                <th className="px-3 py-2 text-right">Holdings</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr
                  key={w.id}
                  draggable={w.id !== "main-wallet"}
                  onDragStart={() => setDragId(w.id)}
                  className="ax-table-row cursor-grab active:cursor-grabbing"
                >
                  <td className="px-3 py-2.5">
                    <p className="font-semibold" style={{ color: w.color ?? "#f5a623" }}>{w.label}</p>
                    <p className="font-mono text-[9px] text-[var(--muted)]">{truncate(w.address)}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {w.balance.toFixed(2)}
                    {w.id === "main-wallet" && <span className="ml-1 text-[9px] text-[var(--primary)]">◎</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[var(--muted)]">{w.holdings}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => onNavigate("receive")} title="Receive" className="border border-[var(--border)] p-1 text-[var(--muted)] hover:text-[var(--gain)]">
                        <Wallet className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => onNavigate("send")} title="Send" className="border border-[var(--border)] p-1 text-[var(--muted)] hover:text-[var(--primary)]">
                        <Send className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="px-3 py-8 text-center text-[11px] text-[var(--muted)]">No wallets match search</p>
          )}
        </div>

        {/* Right — Source + Destinations */}
        <div className="mv-panel flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
            <span className="text-[11px] font-semibold">Source wallets</span>
            <div className="flex items-center gap-1 text-[9px] text-[var(--muted)]">
              <span>Amount</span>
              <input
                value={distAmount}
                onChange={(e) => setDistAmount(e.target.value)}
                className="mv-input !w-14 !py-0.5 text-center font-mono"
                type="number"
                step="0.1"
              />
              <span>SOL</span>
            </div>
          </div>
          <WalletTable
            ids={sourceIds}
            emptyHint="Drag wallets to distribute SOL."
            onDrop={() => handleDropOn("source")}
          />

          <div className="flex items-center justify-between border-y border-[var(--border)] px-3 py-2">
            <span className="text-[11px] font-semibold">Destinations</span>
            <button
              type="button"
              onClick={() => {
                const extra = wallets.find((w) => !destIds.includes(w.id) && w.id !== "main-wallet");
                if (extra) setDestIds((prev) => [...prev, extra.id]);
              }}
              className="rounded-full border border-[var(--primary)] px-2.5 py-1 text-[9px] font-semibold text-[var(--primary)]"
            >
              <Plus className="mr-0.5 inline h-3 w-3" /> Add Destination
            </button>
          </div>
          <WalletTable
            ids={destIds}
            emptyHint="Drag wallets here as destinations."
            onDrop={() => handleDropOn("dest")}
            showAddDest
          />
        </div>
      </div>

      {note && <p className="mv-alert-info text-xs">{note}</p>}
      <p className="text-[9px] text-[var(--muted-dim)]">
        Drag wallets from the list into Source or Destinations to fund distribution · Send/Receive for on-chain transfers
      </p>
    </div>
  );
}