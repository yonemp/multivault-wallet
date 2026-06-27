"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { createSeedPhrase } from "@/lib/wallet/mnemonic";
import { deriveEvmWallet } from "@/lib/wallet/evm";
import { deriveSolanaKeypair } from "@/lib/wallet/solana";
import {
  encryptMnemonic,
  saveEncryptedWallet,
} from "@/lib/wallet/storage";
import { registerWallet } from "@/lib/wallet/register";
import { buildSignInMessage } from "@/lib/auth/message";
import { saveSession } from "@/lib/wallet/session";
import { Copy, ShieldAlert } from "lucide-react";
import nacl from "tweetnacl";

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...Array.from(bytes)));
}

export default function CreateWalletPage() {
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const words = useMemo(
    () => (seedPhrase ? seedPhrase.split(" ") : []),
    [seedPhrase],
  );

  async function handleCreate() {
    setSeedPhrase(createSeedPhrase(12));
  }

  async function handleFinish() {
    if (!seedPhrase || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const evmWallet = deriveEvmWallet(seedPhrase);
      const solanaKeypair = deriveSolanaKeypair(seedPhrase);
      const encrypted = await encryptMnemonic(seedPhrase, password);
      saveEncryptedWallet(encrypted);

      const evmMessage = buildSignInMessage(evmWallet.address, "ethereum");
      const evmSignature = await evmWallet.signMessage(evmMessage);

      await registerWallet({
        address: evmWallet.address,
        chain: "ethereum",
        walletType: "created",
        message: evmMessage,
        signature: evmSignature,
      });

      const solMessage = buildSignInMessage(
        solanaKeypair.publicKey.toBase58(),
        "solana",
      );
      const solSignature = toBase64(
        nacl.sign.detached(
          new TextEncoder().encode(solMessage),
          solanaKeypair.secretKey,
        ),
      );

      await registerWallet({
        address: solanaKeypair.publicKey.toBase58(),
        chain: "solana",
        walletType: "created",
        message: solMessage,
        signature: solSignature,
      });

      saveSession({
        mode: "local",
        walletType: "created",
        evmAddress: evmWallet.address,
        solanaAddress: solanaKeypair.publicKey.toBase58(),
      });

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wallet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-12 sm:px-6">
      <a href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600">
        ← Back to home
      </a>

      <h1 className="mt-8 text-3xl font-bold text-slate-900">Create a new wallet</h1>
      <p className="mt-3 text-slate-500">
        Your seed phrase is generated in your browser and encrypted locally.
        It is never sent to our servers.
      </p>

      {!seedPhrase ? (
        <div className="mt-10">
          <Button size="lg" onClick={handleCreate}>Generate seed phrase</Button>
        </div>
      ) : !confirmed ? (
        <div className="mt-10 space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p>
                Write down these 12 words in order. Anyone with this phrase can
                access your funds. MultiVault cannot recover it for you.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3">
            {words.map((word, index) => (
              <div
                key={word + index}
                className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800"
              >
                <span className="mr-2 text-slate-400">{index + 1}.</span>
                {word}
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(seedPhrase)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy seed phrase
          </Button>

          <Button size="lg" onClick={() => setConfirmed(true)}>
            I saved my seed phrase
          </Button>
        </div>
      ) : (
        <div className="mt-10 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            Create a password to encrypt your wallet on this device
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button size="lg" onClick={handleFinish} disabled={loading}>
            {loading ? "Securing wallet..." : "Create wallet"}
          </Button>
        </div>
      )}
    </main>
  );
}