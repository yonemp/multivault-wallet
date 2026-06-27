"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ActionTabs, DashboardTab } from "@/components/dashboard/ActionTabs";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";
import { ReceivePanel } from "@/components/dashboard/ReceivePanel";
import { SendPanel } from "@/components/dashboard/SendPanel";
import { SwapPanel } from "@/components/dashboard/SwapPanel";
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
      <main className="flex min-h-screen items-center justify-center text-zinc-400">
        Loading...
      </main>
    );
  }

  const ready = session.mode === "external" || unlocked;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
            MultiVault
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Dashboard</h1>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>

      {session.mode === "local" && !unlocked ? (
        <div className="mt-12 max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Unlock wallet</h2>
          <p className="text-sm text-zinc-400">
            Unlock to send, receive, and swap with your wallet.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your encryption password"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-400"
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button onClick={handleUnlock}>Unlock</Button>
        </div>
      ) : (
        <>
          <div className="mt-8">
            <ActionTabs active={activeTab} onChange={setActiveTab} />
          </div>

          <div className="mt-8">
            {activeTab === "overview" && (
              <OverviewPanel session={session} balances={balances} />
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
        </>
      )}
    </main>
  );
}