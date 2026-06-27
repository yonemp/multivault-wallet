"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ActionTabs, DashboardTab } from "@/components/dashboard/ActionTabs";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";
import { ReceivePanel } from "@/components/dashboard/ReceivePanel";
import { SendPanel } from "@/components/dashboard/SendPanel";
import { SwapPanel } from "@/components/dashboard/SwapPanel";
import { Logo } from "@/components/layout/Logo";
import {
  ChainBalances,
  fetchChainBalances,
} from "@/lib/wallet/balances-client";
import { deriveAllAddresses } from "@/lib/wallet/derive-all";
import {
  clearSession,
  loadSession,
  saveSession,
  SessionData,
} from "@/lib/wallet/session";
import {
  clearEncryptedWallet,
  decryptMnemonic,
  loadEncryptedWallet,
} from "@/lib/wallet/storage";
import {
  clearUnlockedMnemonic,
  setUnlockedMnemonic,
} from "@/lib/wallet/unlock-store";
import { LogOut } from "lucide-react";

export default function DashboardPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [balances, setBalances] = useState<ChainBalances>({});
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [booting, setBooting] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    const current = loadSession();
    if (!current) {
      window.location.href = "/";
      return;
    }
    setSession(current);

    if (current.mode === "external") {
      setUnlocked(true);
    }

    if (Object.keys(current.addresses).length > 0) {
      loadBalances(current);
    }
  }, []);

  async function loadBalances(current: SessionData) {
    setLoadingBalances(true);
    try {
      const next = await fetchChainBalances(current.addresses);
      setBalances(next);
    } finally {
      setLoadingBalances(false);
    }
  }

  async function handleUnlock() {
    setError(null);
    try {
      const encrypted = loadEncryptedWallet();
      if (!encrypted) throw new Error("No local wallet found");

      const mnemonic = await decryptMnemonic(encrypted, password);
      const addresses = await deriveAllAddresses(mnemonic);

      const current = loadSession();
      if (!current) return;

      const updated: SessionData = {
        ...current,
        addresses,
        evmAddress: addresses.ethereum,
        solanaAddress: addresses.solana,
      };

      setUnlockedMnemonic(mnemonic);
      saveSession(updated);
      setSession(updated);
      setUnlocked(true);
      await loadBalances(updated);
    } catch {
      setError("Incorrect password");
    }
  }

  function handleLogout() {
    clearUnlockedMnemonic();
    clearSession();
    clearEncryptedWallet();
    window.location.href = "/";
  }

  function refreshBalances() {
    if (session) loadBalances(session);
  }

  const ready = session && (session.mode === "external" || unlocked);
  const hasAddresses =
    session != null && Object.keys(session.addresses).length > 0;
  const showNav = ready || hasAddresses;

  return (
    <>
      <AnimatePresence>
        {booting && (
          <LoadingScreen
            submessage="Syncing Bitcoin, Ethereum, Solana, TON, XRP & more"
            onComplete={() => setBooting(false)}
          />
        )}
      </AnimatePresence>

      {!session ? (
        <main className="flex min-h-screen items-center justify-center text-slate-500">
          Loading...
        </main>
      ) : (
        <div className="min-h-screen">
          <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
              <Logo href="/" compact />

              {showNav && (
                <div className="flex flex-1 items-center justify-start overflow-x-auto">
                  <ActionTabs active={activeTab} onChange={setActiveTab} />
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="shrink-0"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
            {session.mode === "local" && !unlocked && (
              <div className="mx-auto mb-5 max-w-md">
                <Panel className="p-6">
                  <h1 className="text-xl font-semibold text-[var(--foreground)]">Unlock wallet</h1>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Unlock to send or swap. Balances and receive addresses are visible below.
                  </p>
                  <div className="mt-6 space-y-4">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Encryption password"
                      onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                    />
                    {error && (
                      <p className="mv-alert-error">{error}</p>
                    )}
                    <Button className="w-full" size="lg" onClick={handleUnlock}>
                      Unlock wallet
                    </Button>
                  </div>
                </Panel>
              </div>
            )}

            {showNav && (
              <div>
                {activeTab === "overview" && (
                  <OverviewPanel
                    session={session}
                    balances={balances}
                    loading={loadingBalances}
                    onNavigate={setActiveTab}
                    onRefresh={refreshBalances}
                  />
                )}
                {activeTab === "receive" && hasAddresses && (
                  <ReceivePanel session={session} />
                )}
                {activeTab === "send" &&
                  (ready ? (
                    <SendPanel session={session} onSuccess={refreshBalances} />
                  ) : (
                    <p className="text-sm text-[var(--muted)]">
                      Unlock your wallet to send funds.
                    </p>
                  ))}
                {activeTab === "swap" &&
                  (ready ? (
                    <SwapPanel session={session} onSuccess={refreshBalances} />
                  ) : (
                    <p className="text-sm text-[var(--muted)]">
                      Unlock your wallet to swap tokens.
                    </p>
                  ))}
              </div>
            )}
          </main>
        </div>
      )}
    </>
  );
}