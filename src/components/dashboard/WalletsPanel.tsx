"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardTab } from "@/components/dashboard/ActionTabs.types";
import { WalletCardData, WalletDropZone } from "@/components/wallet/WalletDragCard";
import { PasswordConfirmModal } from "@/components/wallet/PasswordConfirmModal";
import { usePasswordPrompt } from "@/hooks/usePasswordPrompt";
import { fetchChainBalances } from "@/lib/wallet/balances-client";
import { clearSession, saveSession, SessionData } from "@/lib/wallet/session";
import { sessionFromVaultWallet } from "@/lib/wallet/setup-wallet";
import {
  getActiveWalletId,
  loadVault,
  removeVaultWallet,
  setActiveWalletId,
  VaultWallet,
} from "@/lib/wallet/wallet-vault";
import { clearUnlockedMnemonic } from "@/lib/wallet/unlock-store";
import { verifyWalletPassword } from "@/lib/wallet/verify-password";
import {
  getActiveWalletIds,
  loadWalletLayout,
  moveWalletToZone,
  WalletLayout,
} from "@/lib/platform/wallet-layout";
import {
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
  onNavigate: (tab: DashboardTab) => void;
  onRefresh?: () => void;
  onSessionChange?: (session: SessionData) => void;
  welcome?: boolean;
};

export function WalletsPanel({
  session,
  onNavigate,
  onRefresh,
  onSessionChange,
  welcome,
}: WalletsPanelProps) {
  const [vaultWallets, setVaultWallets] = useState<VaultWallet[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [layout, setLayout] = useState<WalletLayout>({ sourceIds: [], destIds: [] });
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [distAmount, setDistAmount] = useState("0.5");
  const [note, setNote] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VaultWallet | null>(null);

  const passwordPrompt = usePasswordPrompt();

  const refreshVault = useCallback(() => {
    const vault = loadVault();
    setVaultWallets(vault);
    setLayout(loadWalletLayout());
    setActiveId(getActiveWalletId() ?? session.activeWalletId ?? vault[0]?.id ?? null);
  }, [session.activeWalletId]);

  useEffect(() => {
    refreshVault();
  }, [refreshVault]);

  useEffect(() => {
    async function loadBalances() {
      const vault = loadVault();
      const entries = await Promise.all(
        vault.map(async (w) => {
          const sol = w.addresses.solana;
          if (!sol) return [w.id, 0] as const;
          try {
            const b = await fetchChainBalances({ solana: sol });
            return [w.id, parseFloat(b.solana ?? "0") || 0] as const;
          } catch {
            return [w.id, 0] as const;
          }
        }),
      );
      setBalances(Object.fromEntries(entries));
    }
    loadBalances();
  }, [vaultWallets.length]);

  const allIds = vaultWallets.map((w) => w.id);
  const activeIds = useMemo(() => getActiveWalletIds(allIds), [allIds, layout]);

  const walletMap = useMemo(() => {
    const map = new Map<string, WalletCardData>();
    for (const w of vaultWallets) {
      map.set(w.id, {
        id: w.id,
        label: w.label,
        address: w.addresses.solana ?? "—",
        balance: balances[w.id] ?? 0,
        holdings: Object.keys(w.addresses).length,
        color: w.color,
      });
    }
    return map;
  }, [vaultWallets, balances]);

  const filteredActiveIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeIds.filter((id) => {
      const w = walletMap.get(id);
      if (!w) return false;
      if (!q) return true;
      return w.label.toLowerCase().includes(q) || w.address.toLowerCase().includes(q);
    });
  }, [activeIds, walletMap, search]);

  function handleDrop(walletId: string, zone: "active" | "source" | "dest") {
    const next = moveWalletToZone(walletId, zone, allIds);
    setLayout(next);
    setNote(
      zone === "active"
        ? `Moved to active wallets`
        : zone === "source"
          ? `Added to source wallets`
          : `Added to destinations`,
    );
  }

  async function handleSetActive(walletId: string) {
    const wallet = vaultWallets.find((w) => w.id === walletId);
    if (!wallet) return;
    setActiveWalletId(walletId);
    setActiveId(walletId);
    const nextSession = sessionFromVaultWallet(wallet);
    saveSession(nextSession);
    onSessionChange?.(nextSession);
    setNote(`"${wallet.label}" is now your active trading wallet`);
    onRefresh?.();
  }

  function distributeToDest(destId: string) {
    if (!layout.sourceIds.length) {
      setNote("Drag a wallet into Source wallets first");
      return;
    }
    const amt = parseFloat(distAmount) || 0;
    if (amt <= 0) {
      setNote("Enter a valid SOL amount");
      return;
    }
    const sourceId = layout.sourceIds[0];
    const source = walletMap.get(sourceId);
    const dest = walletMap.get(destId);
    if (!source || source.balance < amt) {
      setNote("Insufficient source balance — fund source wallet on-chain first");
      return;
    }
    setNote(`Ready to send ${amt} SOL from ${source.label} → ${dest?.label ?? "destination"}. Use Send with source wallet active.`);
    handleSetActive(sourceId);
    onNavigate("send");
  }

  function promptDeleteWallet(wallet: VaultWallet) {
    setDeleteTarget(wallet);
    passwordPrompt.requestPassword({
      title: "Delete wallet",
      description: `Enter your password to permanently remove "${wallet.label}" from this device. This cannot be undone.`,
      confirmLabel: "Delete wallet",
      action: async (password) => {
        await verifyWalletPassword(password);
        removeVaultWallet(wallet.id);
        setDeleteTarget(null);
        refreshVault();
        const remaining = loadVault();
        if (!remaining.length) {
          clearUnlockedMnemonic();
          clearSession();
          window.location.href = "/";
          return;
        }
        const next = remaining.find((w) => w.id === getActiveWalletId()) ?? remaining[0];
        const nextSession = sessionFromVaultWallet(next);
        saveSession(nextSession);
        onSessionChange?.(nextSession);
        setNote(`"${wallet.label}" removed from vault`);
        onRefresh?.();
      },
    });
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(vaultWallets.map((w) => ({
      label: w.label,
      address: w.addresses.solana,
      walletType: w.walletType,
    })), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "multivault-wallets.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {welcome && (
        <div className="mv-panel border border-[var(--gain)]/30 bg-[var(--gain-soft)] px-4 py-3 text-xs">
          <p className="font-semibold text-[var(--gain)]">Wallet added to your vault</p>
          <p className="mt-1 text-[var(--muted)]">
            Drag wallet cards between <strong>Active</strong>, <strong>Source</strong>, and <strong>Destinations</strong>. Star a wallet to make it your active signer for trades and sends.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-dim)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wallets"
            className="mv-input w-full pl-9 text-xs"
          />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCreateOpen((o) => !o)}
            className="flex items-center gap-1 rounded-full border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-[10px] font-semibold text-white"
          >
            <Plus className="h-3 w-3" /> Create <ChevronDown className="h-3 w-3" />
          </button>
          {createOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] border border-[var(--border-strong)] bg-[var(--surface-solid)] py-1 shadow-[var(--shadow-md)]">
              <Link href="/create?add=1" className="block px-3 py-2 text-[10px] hover:bg-[var(--surface-hover)]">New wallet (seed)</Link>
              <Link href="/import?add=1" className="block px-3 py-2 text-[10px] hover:bg-[var(--surface-hover)]">Import wallet</Link>
            </div>
          )}
        </div>
        <button type="button" onClick={handleExport} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)]">
          <Download className="mr-1 inline h-3 w-3" /> Export
        </button>
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
          On-chain transfers appear after you use Send. Drag wallets to organize source → destination flows.
        </div>
      )}

      {!vaultWallets.length && (
        <div className="mv-panel flex flex-col items-center gap-4 px-6 py-16 text-center">
          <Wallet className="h-10 w-10 text-[var(--muted)]" />
          <p className="text-sm font-semibold">No wallets yet</p>
          <p className="max-w-sm text-xs text-[var(--muted)]">Create or import your first wallet to start trading with multiple accounts.</p>
          <div className="flex gap-2">
            <Link href="/create" className="border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white">Create wallet</Link>
            <Link href="/import" className="border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]">Import wallet</Link>
          </div>
        </div>
      )}

      {vaultWallets.length > 0 && (
        <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[1fr_1.1fr]">
          <div className="mv-panel flex min-h-[320px] flex-col overflow-hidden">
            <WalletDropZone
              zone="active"
              label={`Active wallets (${filteredActiveIds.length})`}
              hint="Drag wallets here from Source or Destinations"
              walletIds={filteredActiveIds}
              walletMap={walletMap}
              onDrop={handleDrop}
              onSetActive={handleSetActive}
              activeWalletId={activeId}
              onDelete={(id) => {
                const w = vaultWallets.find((v) => v.id === id);
                if (w) promptDeleteWallet(w);
              }}
              headerRight={
                <div className="flex gap-1">
                  <button type="button" onClick={() => onNavigate("receive")} title="Receive" className="border border-[var(--border)] p-1 text-[var(--muted)]">
                    <Wallet className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => onNavigate("send")} title="Send" className="border border-[var(--border)] p-1 text-[var(--muted)]">
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              }
            />
          </div>

          <div className="mv-panel flex min-h-[320px] flex-col overflow-hidden">
            <WalletDropZone
              zone="source"
              label="Source wallets"
              hint="Drag wallets here to fund distributions"
              walletIds={layout.sourceIds}
              walletMap={walletMap}
              onDrop={handleDrop}
              onSetActive={handleSetActive}
              activeWalletId={activeId}
              headerRight={
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
              }
            />
            <WalletDropZone
              zone="dest"
              label="Destinations"
              hint="Drag wallets here as receive targets"
              walletIds={layout.destIds}
              walletMap={walletMap}
              onDrop={handleDrop}
              onSetActive={handleSetActive}
              activeWalletId={activeId}
              showFund
              onFund={distributeToDest}
            />
          </div>
        </div>
      )}

      {note && <p className="mv-alert-info text-xs">{note}</p>}
      <p className="text-[9px] text-[var(--muted-dim)]">
        Pick up any wallet card and drop it on Active, Source, or Destinations · Moving from Source goes to Active or Destinations
      </p>

      <PasswordConfirmModal
        open={passwordPrompt.open}
        title={passwordPrompt.title}
        description={passwordPrompt.description}
        confirmLabel={passwordPrompt.confirmLabel}
        onClose={() => {
          passwordPrompt.close();
          setDeleteTarget(null);
        }}
        onConfirm={passwordPrompt.confirm}
      />
      {deleteTarget && (
        <p className="sr-only">Deleting {deleteTarget.label}</p>
      )}
    </div>
  );
}