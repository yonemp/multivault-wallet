"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PremiumStepper } from "@/components/marketing/PremiumStepper";
import { createSeedPhrase } from "@/lib/wallet/mnemonic";
import { UsernamePicker } from "@/components/onboarding/UsernamePicker";
import { hasAccountUsername, saveUsernameForWallet } from "@/lib/platform/account-username";
import { setupLocalWallet } from "@/lib/wallet/setup-wallet";
import { vaultWalletCount } from "@/lib/wallet/wallet-vault";
import { BRAND_NAME } from "@/lib/brand";
import { CheckCircle2, Copy, ShieldAlert } from "lucide-react";

const STEPS = [
  { id: "intro", label: "Start" },
  { id: "backup", label: "Backup" },
  { id: "secure", label: "Secure" },
  { id: "username", label: "Profile" },
  { id: "done", label: "Ready" },
];

export default function CreateWalletPage() {
  const searchParams = useSearchParams();
  const isAdding = searchParams.get("add") === "1" || vaultWalletCount() > 0;

  const [step, setStep] = useState("intro");
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [writtenDown, setWrittenDown] = useState(false);
  const [label, setLabel] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAddress, setCreatedAddress] = useState<string | null>(null);

  const words = useMemo(
    () => (seedPhrase ? seedPhrase.split(" ") : []),
    [seedPhrase],
  );

  const displaySteps = useMemo(
    () =>
      isAdding || hasAccountUsername()
        ? STEPS.filter((s) => s.id !== "username")
        : STEPS,
    [isAdding],
  );

  function handleGenerate() {
    setSeedPhrase(createSeedPhrase(12));
    setStep("backup");
  }

  async function handleFinish() {
    if (!seedPhrase) return;
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
        mnemonic: seedPhrase,
        password,
        walletType: "created",
        label: label.trim() || undefined,
        makeActive: !isAdding || vaultWalletCount() === 0,
      });
      const addr =
        vaultWallet.addresses.solana ??
        vaultWallet.addresses.ethereum ??
        null;
      setCreatedAddress(addr);
      setStep(!isAdding && !hasAccountUsername() ? "username" : "done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wallet");
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
        <Link href="/sign-in" className="mv-premium-ghost-link">
          Sign in
        </Link>
      }
    >
      <PremiumStepper steps={displaySteps} current={step} />

      {step === "intro" && (
        <div className="mv-premium-flow">
          <div className="mv-premium-page-head mv-premium-page-head--left">
            <h1 className="mv-premium-page-title">
              {isAdding ? "Add wallet" : "Create wallet"}
            </h1>
            <p className="mv-premium-page-sub">
              Generate a 12-word phrase. Encrypted locally â€” never sent to our servers.
            </p>
          </div>

          {!isAdding && (
            <div className="mv-premium-panel">
              <label className="mv-premium-label">Wallet name (optional)</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Trading wallet"
                className="mv-premium-input mt-2"
              />
            </div>
          )}

          <Button size="lg" className="mv-premium-action w-full" onClick={handleGenerate}>
            Generate phrase
          </Button>
        </div>
      )}

      {step === "backup" && seedPhrase && (
        <div className="mv-premium-flow">
          <div className="mv-premium-page-head mv-premium-page-head--left">
            <h1 className="mv-premium-page-title">Back up phrase</h1>
            <p className="mv-premium-page-sub">Store offline. {BRAND_NAME} cannot recover a lost phrase.</p>
          </div>

          <div className="mv-premium-alert">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Anyone with these words controls your funds.</span>
          </div>

          <div className="mv-premium-seed-grid">
            {words.map((word, index) => (
              <div key={`${word}-${index}`} className="mv-premium-seed-word">
                <span>{index + 1}</span>
                {word}
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            className="mv-premium-action-secondary"
            onClick={() => navigator.clipboard.writeText(seedPhrase)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy phrase
          </Button>

          <label className="mv-premium-check">
            <input
              type="checkbox"
              checked={writtenDown}
              onChange={(e) => setWrittenDown(e.target.checked)}
            />
            <span>I saved this phrase offline</span>
          </label>

          <Button
            size="lg"
            className="mv-premium-action w-full"
            disabled={!writtenDown}
            onClick={() => setStep("secure")}
          >
            Continue
          </Button>
        </div>
      )}

      {step === "secure" && (
        <div className="mv-premium-flow">
          <div className="mv-premium-page-head mv-premium-page-head--left">
            <h1 className="mv-premium-page-title">Set password</h1>
            <p className="mv-premium-page-sub">
              Required for withdrawals, wallet deletion, and contact changes.
            </p>
          </div>

          <div className="mv-premium-panel mv-premium-panel--stack">
            {isAdding && (
              <>
                <label className="mv-premium-label">Wallet name</label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={`Wallet ${vaultWalletCount() + 1}`}
                  className="mv-premium-input"
                />
              </>
            )}
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
            <Button size="lg" className="mv-premium-action w-full" onClick={handleFinish} disabled={loading}>
              {loading ? "Securingâ€¦" : "Create wallet"}
            </Button>
          </div>
        </div>
      )}

      {step === "username" && createdAddress && (
        <div className="mv-premium-flow">
          <UsernamePicker
            onSubmit={async (username, profileVisibility) => {
              await saveUsernameForWallet(createdAddress, username, "#526fff", profileVisibility);
              setStep("done");
            }}
          />
        </div>
      )}

      {step === "done" && (
        <div className="mv-premium-flow mv-premium-flow--center">
          <div className="mv-premium-success-icon">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mv-premium-page-title">Wallet ready</h1>
          {createdAddress && (
            <p className="mv-premium-address">
              SOL {createdAddress.slice(0, 6)}â€¦{createdAddress.slice(-4)}
            </p>
          )}
          <div className="mv-premium-done-actions">
            <Button
              size="lg"
              className="mv-premium-action"
              onClick={() => { window.location.href = "/dashboard?tab=overview&wallets=1&welcome=1"; }}
            >
              Open terminal
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="mv-premium-action-secondary"
              onClick={() => { window.location.href = "/create?add=1"; }}
            >
              Add another
            </Button>
          </div>
        </div>
      )}
    </MarketingShell>
  );
}