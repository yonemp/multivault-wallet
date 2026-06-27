"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
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
import { deriveEvmWallet, EVM_CHAINS, getEvmBalance } from "@/lib/wallet/evm";
import { deriveSolanaKeypair, SOLANA_RPC } from "@/lib/wallet/solana";
import { Connection } from "@solana/web3.js";
import { LogOut, Wallet } from "lucide-react";

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
        await import("@solana/web3.js").then((m) =>
          new m.PublicKey(current.solanaAddress!),
        ),
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

      saveSession(updated);
      setSession(updated);
      setUnlocked(true);
      await loadBalances(updated);
    } catch {
      setError("Incorrect password");
    }
  }

  function handleLogout() {
    clearSession();
    clearEncryptedWallet();
    window.location.href = "/";
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center text-zinc-400">
        Loading...
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
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
        <div className="mt-12 grid gap-6 md:grid-cols-2">
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
              <p className="mt-4 text-xs text-zinc-500">
                Connected via{" "}
                {session.walletType === "created"
                  ? "new wallet"
                  : session.walletType}
              </p>
            </section>
          )}

          {session.solanaAddress && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-purple-300" />
                <h2 className="text-lg font-semibold text-white">
                  Solana Wallet
                </h2>
              </div>
              <p className="mt-4 break-all font-mono text-sm text-zinc-300">
                {session.solanaAddress}
              </p>
              <div className="mt-6 text-sm text-zinc-400">
                <p>Solana: {balances.sol ?? "..."} SOL</p>
              </div>
              <p className="mt-4 text-xs text-zinc-500">
                Connected via{" "}
                {session.walletType === "phantom"
                  ? "Phantom"
                  : session.walletType}
              </p>
            </section>
          )}
        </div>
      )}
    </main>
  );
}