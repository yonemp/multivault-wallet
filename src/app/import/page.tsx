"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { isValidSeedPhrase } from "@/lib/wallet/mnemonic";
import { deriveEvmWallet } from "@/lib/wallet/evm";
import { deriveSolanaKeypair } from "@/lib/wallet/solana";
import {
  encryptMnemonic,
  saveEncryptedWallet,
} from "@/lib/wallet/storage";
import { registerWallet } from "@/lib/wallet/register";
import { buildSignInMessage } from "@/lib/auth/message";
import { saveSession } from "@/lib/wallet/session";
import nacl from "tweetnacl";

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...Array.from(bytes)));
}

export default function ImportWalletPage() {
  const [seedPhrase, setSeedPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    const normalized = seedPhrase.trim().toLowerCase();

    if (!isValidSeedPhrase(normalized)) {
      setError("Invalid seed phrase. Check the words and order.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const evmWallet = deriveEvmWallet(normalized);
      const solanaKeypair = deriveSolanaKeypair(normalized);
      const encrypted = await encryptMnemonic(normalized, password);
      saveEncryptedWallet(encrypted);

      const evmMessage = buildSignInMessage(evmWallet.address, "ethereum");
      const evmSignature = await evmWallet.signMessage(evmMessage);

      await registerWallet({
        address: evmWallet.address,
        chain: "ethereum",
        walletType: "imported",
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
        walletType: "imported",
        message: solMessage,
        signature: solSignature,
      });

      saveSession({
        mode: "local",
        walletType: "imported",
        evmAddress: evmWallet.address,
        solanaAddress: solanaKeypair.publicKey.toBase58(),
      });

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import wallet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12">
      <a href="/" className="text-sm text-zinc-400 hover:text-white">
        ← Back
      </a>

      <h1 className="mt-8 text-3xl font-bold text-white">Import wallet</h1>
      <p className="mt-3 text-zinc-400">
        Enter your 12 or 24-word recovery phrase. It stays on your device and
        is encrypted with your password.
      </p>

      <div className="mt-10 space-y-4">
        <textarea
          value={seedPhrase}
          onChange={(e) => setSeedPhrase(e.target.value)}
          rows={4}
          placeholder="word1 word2 word3 ..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-violet-400"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Encryption password (min 8 chars)"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-violet-400"
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button onClick={handleImport} disabled={loading}>
          {loading ? "Importing..." : "Import wallet"}
        </Button>
      </div>
    </main>
  );
}