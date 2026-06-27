"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { Logo } from "@/components/layout/Logo";
import { OnboardingStepper } from "@/components/wallet/OnboardingStepper";
import { isValidSeedPhrase } from "@/lib/wallet/mnemonic";
import { UsernamePicker } from "@/components/onboarding/UsernamePicker";
import { hasAccountUsername, saveUsernameForWallet } from "@/lib/platform/account-username";
import { setupLocalWallet } from "@/lib/wallet/setup-wallet";
import { vaultWalletCount } from "@/lib/wallet/wallet-vault";
import { CheckCircle2, Download, KeyRound, Shield } from "lucide-react";

const STEPS = [
  { id: "phrase", label: "Phrase" },
  { id: "secure", label: "Secure" },
  { id: "username", label: "Username" },
  { id: "done", label: "Ready" },
];

export default function ImportWalletPage() {
  const searchParams = useSearchParams();
  const isAdding = searchParams.get("add") === "1" || vaultWalletCount() > 0;

  const [step, setStep] = useState("phrase");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [label, setLabel] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedAddress, setImportedAddress] = useState<string | null>(null);

  const displaySteps = useMemo(
    () =>
      isAdding || hasAccountUsername()
        ? STEPS.filter((s) => s.id !== "username")
        : STEPS,
    [isAdding],
  );

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
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { vaultWallet } = await setupLocalWallet({
        mnemonic: normalized,
        password,
        walletType: "imported",
        label: label.trim() || undefined,
        makeActive: !isAdding,
      });
      const addr =
        vaultWallet.addresses.solana ??
        vaultWallet.addresses.ethereum ??
        null;
      setImportedAddress(addr);
      setStep(!isAdding && !hasAccountUsername() ? "username" : "done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import wallet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo href="/" compact />
          <Link href={isAdding ? "/dashboard?tab=overview&wallets=1" : "/"} className="text-xs text-[var(--muted)] hover:text-[var(--primary)]">
            {isAdding ? "← Back to wallets" : "← Home"}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex justify-center">
          <OnboardingStepper steps={displaySteps} current={step} />
        </div>

        {step === "phrase" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary-soft)]">
                <Download className="h-7 w-7 text-[var(--primary)]" />
              </div>
              <h1 className="text-2xl font-semibold">
                {isAdding ? "Import another wallet" : "Import wallet"}
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--muted)]">
                Restore a wallet with your 12 or 24-word recovery phrase. Encrypted locally on your device.
              </p>
            </div>

            <Panel className="space-y-4 p-5">
              <label className="mv-label">Recovery phrase</label>
              <textarea
                value={seedPhrase}
                onChange={(e) => setSeedPhrase(e.target.value)}
                rows={4}
                placeholder="word1 word2 word3 …"
                className="mv-input resize-none"
              />
              <label className="mv-label">Wallet name (optional)</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Old Trading Wallet"
              />
              <div className="flex items-start gap-2 text-[10px] text-[var(--muted)]">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Phrase never leaves your browser — encrypted with your password before storage.
              </div>
              <Button size="lg" className="w-full" onClick={() => setStep("secure")} disabled={!seedPhrase.trim()}>
                Continue
              </Button>
              {!isAdding && (
                <p className="text-center text-xs text-[var(--muted)]">
                  Or{" "}
                  <Link href="/sign-in" className="text-[var(--primary)] hover:underline">
                    connect MetaMask, Phantom, or Trust
                  </Link>
                </p>
              )}
            </Panel>
          </div>
        )}

        {step === "secure" && (
          <Panel className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[var(--primary)]" />
              <h2 className="text-lg font-semibold">Set encryption password</h2>
            </div>
            <label className="mv-label">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
            <label className="mv-label">Confirm password</label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
            />
            {error && <p className="mv-alert-error">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("phrase")}>Back</Button>
              <Button size="lg" className="flex-1" onClick={handleImport} disabled={loading}>
                {loading ? "Importing…" : "Import wallet"}
              </Button>
            </div>
          </Panel>
        )}

        {step === "username" && importedAddress && (
          <UsernamePicker
            onSubmit={async (username, profileVisibility) => {
              await saveUsernameForWallet(importedAddress, username, "#526fff", profileVisibility);
              setStep("done");
            }}
          />
        )}

        {step === "done" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gain)]/40 bg-[var(--gain-soft)]">
              <CheckCircle2 className="h-8 w-8 text-[var(--gain)]" />
            </div>
            <h2 className="text-xl font-semibold">Wallet imported</h2>
            {importedAddress && (
              <p className="font-mono text-xs text-[var(--primary)]">
                SOL {importedAddress.slice(0, 6)}…{importedAddress.slice(-4)}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={() => { window.location.href = "/dashboard?tab=overview&wallets=1"; }}>
                Open Portfolio → Wallets
              </Button>
              <Button variant="secondary" size="lg" onClick={() => { window.location.href = "/import?add=1"; }}>
                Import another
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}