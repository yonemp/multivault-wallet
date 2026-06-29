"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PremiumStepper } from "@/components/marketing/PremiumStepper";
import { isValidSeedPhrase } from "@/lib/wallet/mnemonic";
import { UsernamePicker } from "@/components/onboarding/UsernamePicker";
import { hasAccountUsername, saveUsernameForWallet } from "@/lib/platform/account-username";
import { setupLocalWallet } from "@/lib/wallet/setup-wallet";
import { vaultWalletCount } from "@/lib/wallet/wallet-vault";
import { CheckCircle2, Shield } from "lucide-react";

const STEPS = [
  { id: "phrase", label: "Phrase" },
  { id: "secure", label: "Secure" },
  { id: "username", label: "Profile" },
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
    <MarketingShell
      narrow
      backHref={isAdding ? "/dashboard?tab=overview&wallets=1" : "/"}
      backLabel={isAdding ? "Wallets" : "Home"}
      headerRight={
        <Link href="/create" className="mv-premium-btn mv-premium-btn--solid">
          Create wallet
        </Link>
      }
    >
      <PremiumStepper steps={displaySteps} current={step} />

      {step === "phrase" && (
        <div className="mv-premium-flow">
          <div className="mv-premium-page-head mv-premium-page-head--left">
            <h1 className="mv-premium-page-title">
              {isAdding ? "Import another wallet" : "Import wallet"}
            </h1>
            <p className="mv-premium-page-sub">
              Restore with your 12 or 24-word phrase. Encrypted locally on your device.
            </p>
          </div>

          <div className="mv-premium-panel space-y-4">
            <label className="mv-premium-label">Recovery phrase</label>
            <textarea
              value={seedPhrase}
              onChange={(e) => setSeedPhrase(e.target.value)}
              rows={4}
              placeholder="word1 word2 word3 …"
              className="mv-premium-input resize-none"
            />
            <label className="mv-premium-label">Wallet name (optional)</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Old trading wallet"
              className="mv-premium-input"
            />
            <p className="flex items-start gap-2 text-xs text-[var(--p-dim)]">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Your phrase never leaves this browser.
            </p>
            <Button
              size="lg"
              className="mv-premium-action w-full"
              onClick={() => setStep("secure")}
              disabled={!seedPhrase.trim()}
            >
              Continue
            </Button>
            {!isAdding && (
              <p className="text-center text-xs text-[var(--p-dim)]">
                Or{" "}
                <Link href="/sign-in" className="text-[var(--p-accent)] hover:underline">
                  connect MetaMask, Phantom, or Trust
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      {step === "secure" && (
        <div className="mv-premium-flow">
          <div className="mv-premium-panel space-y-4">
            <h2 className="text-lg font-semibold text-[var(--p-text)]">Encrypt your vault</h2>
            <label className="mv-premium-label">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="mv-premium-input"
            />
            <label className="mv-premium-label">Confirm password</label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="mv-premium-input"
            />
            {error && <p className="mv-alert-error">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("phrase")}>
                Back
              </Button>
              <Button
                size="lg"
                className="mv-premium-action flex-1"
                onClick={handleImport}
                disabled={loading}
              >
                {loading ? "Importing…" : "Import wallet"}
              </Button>
            </div>
          </div>
        </div>
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
        <div className="mv-premium-flow mv-premium-flow--center">
          <div className="mv-premium-success-icon">
            <CheckCircle2 className="h-10 w-10 text-[var(--p-green)]" />
          </div>
          <h2 className="mv-premium-page-title">Wallet imported</h2>
          {importedAddress && (
            <p className="font-mono text-sm text-[var(--p-accent)]">
              {importedAddress.slice(0, 6)}…{importedAddress.slice(-4)}
            </p>
          )}
          <div className="mv-premium-hero-actions justify-center">
            <Button
              size="lg"
              className="mv-premium-action"
              onClick={() => {
                window.location.href = "/dashboard?tab=overview&wallets=1";
              }}
            >
              Open terminal
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                window.location.href = "/import?add=1";
              }}
            >
              Import another
            </Button>
          </div>
        </div>
      )}
    </MarketingShell>
  );
}