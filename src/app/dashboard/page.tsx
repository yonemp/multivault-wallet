"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ActionTabs, DashboardTab } from "@/components/dashboard/ActionTabs";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";
import { ReceivePanel } from "@/components/dashboard/ReceivePanel";
import { SendPanel } from "@/components/dashboard/SendPanel";
import { SwapPanel } from "@/components/dashboard/SwapPanel";
import { Logo } from "@/components/layout/Logo";
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
import { deriveEvmWallet, EVM_CHAINS, getEvmBalance } from "@/lib/wallet/evm";
import { deriveSolanaKeypair, SOLANA_RPC } from "@/lib/wallet/solana";
import { Connection, PublicKey } from "@solana/web3.js";
import { LogOut } from "lucide-react";

type Balances = {
  eth?: string;
  matic?: string;
  bnb?: string;
  sol?: string;
};

export default function DashboardPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [balances, setBalances] = useState<Balances>({});
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  useEffect(() => {
    const current = loadSession();
    if (!current) {
      window.location.href = "/";
      return;
    }
    setSession(current);

    if (current.mode === "external") {
      setUnlocked(true);
      loadBalances(current);
    }
  }, []);

  async function loadBalances(current: SessionData) {
    const next: Balances = {};

    if (current.evmAddress) {
      next.eth = await getEvmBalance(
        current.evmAddress,
        EVM_CHAINS.ethereum.rpc,
      );
      next.matic = await getEvmBalance(
        current.evmAddress,
        EVM_CHAINS.polygon.rpc,
      );
      next.bnb = await getEvmBalance(current.evmAddress, EVM_CHAINS.bsc.rpc);
    }

    if (current.solanaAddress) {
      const connection = new Connection(SOLANA_RPC, "confirmed");
      const lamports = await connection.getBalance(
        new PublicKey(current.solanaAddress),
      );
      next.sol = (lamports / 1e9).toFixed(4);
    }

    setBalances(next);
  }

  async function handleUnlock() {
    setError(null);
    try {
      const encrypted = loadEncryptedWallet();
      if (!encrypted) {
        throw new Error("No local wallet found");
      }

      const mnemonic = await decryptMnemonic(encrypted, password);
      const evmWallet = deriveEvmWallet(mnemonic);
      const solanaKeypair = deriveSolanaKeypair(mnemonic);

      const current = loadSession();
      if (!current) return;

      const updated: SessionData = {
        ...current,
        evmAddress: evmWallet.address,
        solanaAddress: solanaKeypair.publicKey.toBase58(),
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

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Loading...
      </main>
    );
  }

  const ready = session.mode === "external" || unlocked;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Logo href="/" compact />

          {ready && (
            <div className="flex flex-1 items-center justify-start overflow-x-auto">
              <ActionTabs active={activeTab} onChange={setActiveTab} />
            </div>
          )}

          <Button variant="ghost" size="sm" onClick={handleLogout} className="shrink-0">
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {session.mode === "local" && !unlocked ? (
          <div className="mx-auto max-w-md">
            <Card className="shadow-lg shadow-blue-100/50">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Unlock wallet</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your password to send, receive, and swap with your wallet.
                </p>
              </div>
              <div className="space-y-4">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Encryption password"
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                />
                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}
                <Button className="w-full" size="lg" onClick={handleUnlock}>
                  Unlock wallet
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div>
            {activeTab === "overview" && (
              <OverviewPanel
                session={session}
                balances={balances}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === "receive" && ready && (
              <ReceivePanel session={session} />
            )}
            {activeTab === "send" && ready && (
              <SendPanel session={session} onSuccess={refreshBalances} />
            )}
            {activeTab === "swap" && ready && (
              <SwapPanel session={session} onSuccess={refreshBalances} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}