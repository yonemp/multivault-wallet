"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { isValidSeedPhrase } from "@/lib/wallet/mnemonic";
import { deriveAllAddresses } from "@/lib/wallet/derive-all";
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

      const addresses = await deriveAllAddresses(normalized);
      saveSession({
        mode: "local",
        walletType: "imported",
        addresses,
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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-12 sm:px-6">
      <a href="/" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)]">
        ← Back to home
      </a>

      <h1 className="mt-8 text-2xl font-semibold text-[var(--foreground)]">Import wallet</h1>
      <p className="mt-3 text-[var(--muted)]">
        Enter your 12 or 24-word recovery phrase. It stays on your device and
        is encrypted with your password.
      </p>

      <Panel className="mt-10 space-y-4 p-5">
        <label className="mv-label">Recovery phrase</label>
        <textarea
          value={seedPhrase}
          onChange={(e) => setSeedPhrase(e.target.value)}
          rows={4}
          placeholder="word1 word2 word3 ..."
          className="mv-input resize-none"
        />
        <label className="mv-label">Encryption password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 8 characters"
        />
        {error && <p className="mv-alert-error">{error}</p>}
        <Button size="lg" onClick={handleImport} disabled={loading}>
          {loading ? "Importing..." : "Import wallet"}
        </Button>
      </Panel>
    </main>
  );
}