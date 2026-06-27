"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { createSeedPhrase } from "@/lib/wallet/mnemonic";
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

      const addresses = await deriveAllAddresses(seedPhrase);
      saveSession({
        mode: "local",
        walletType: "created",
        addresses,
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
      <a href="/" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)]">
        ← Back to home
      </a>

      <h1 className="mt-8 text-2xl font-semibold text-[var(--foreground)]">Create a new wallet</h1>
      <p className="mt-3 text-[var(--muted)]">
        Your seed phrase is generated in your browser and encrypted locally.
        It is never sent to our servers.
      </p>

      {!seedPhrase ? (
        <div className="mt-10">
          <Button size="lg" onClick={handleCreate}>Generate seed phrase</Button>
        </div>
      ) : !confirmed ? (
        <div className="mt-10 space-y-6">
          <div className="mv-alert-warn">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p>
                Write down these 12 words in order. Anyone with this phrase can
                access your funds. MultiVault cannot recover it for you.
              </p>
            </div>
          </div>

          <Panel className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
            {words.map((word, index) => (
              <div
                key={word + index}
                className="border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2 text-sm font-medium text-[var(--foreground)]"
              >
                <span className="mr-2 text-[var(--muted)]">{index + 1}.</span>
                {word}
              </div>
            ))}
          </Panel>

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
        <Panel className="mt-10 space-y-4 p-5">
          <label className="mv-label">
            Encryption password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
          />
          {error && <p className="mv-alert-error">{error}</p>}
          <Button size="lg" onClick={handleFinish} disabled={loading}>
            {loading ? "Securing wallet..." : "Create wallet"}
          </Button>
        </Panel>
      )}
    </main>
  );
}