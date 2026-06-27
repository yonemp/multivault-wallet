"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { Logo } from "@/components/layout/Logo";
import { OnboardingStepper } from "@/components/wallet/OnboardingStepper";
import { createSeedPhrase } from "@/lib/wallet/mnemonic";
import { UsernamePicker } from "@/components/onboarding/UsernamePicker";
import { hasAccountUsername, saveUsernameForWallet } from "@/lib/platform/account-username";
import { setupLocalWallet } from "@/lib/wallet/setup-wallet";
import { vaultWalletCount } from "@/lib/wallet/wallet-vault";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Shield,
  ShieldAlert,
  Sparkles,
  Wallet,
} from "lucide-react";

const STEPS = [
  { id: "intro", label: "Start" },
  { id: "backup", label: "Backup" },
  { id: "secure", label: "Secure" },
  { id: "username", label: "Username" },
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

        {step === "intro" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary-soft)]">
                <Sparkles className="h-7 w-7 text-[var(--primary)]" />
              </div>
              <h1 className="text-2xl font-semibold">
                {isAdding ? "Create another wallet" : "Create your wallet"}
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
                {isAdding
                  ? "Add a new trading wallet to your vault. Each wallet has its own seed phrase and can be dragged into source or destination slots."
                  : "Generate a 12-word seed phrase in your browser. It is encrypted locally and never sent to our servers."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Shield, title: "Self-custody", desc: "Only you hold the keys" },
                { icon: KeyRound, title: "Encrypted", desc: "Password-protected on device" },
                { icon: Wallet, title: "Multi-wallet", desc: "Trade with many wallets" },
              ].map(({ icon: Icon, title, desc }) => (
                <Panel key={title} className="p-4 text-center">
                  <Icon className="mx-auto h-5 w-5 text-[var(--primary)]" />
                  <p className="mt-2 text-xs font-semibold">{title}</p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">{desc}</p>
                </Panel>
              ))}
            </div>

            {!isAdding && (
              <Panel className="p-4">
                <label className="mv-label">Wallet name (optional)</label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Trading Wallet 1"
                  className="mt-1"
                />
              </Panel>
            )}

            <Button size="lg" className="w-full" onClick={handleGenerate}>
              Generate seed phrase
            </Button>
          </div>
        )}

        {step === "backup" && seedPhrase && (
          <div className="space-y-6">
            <div className="mv-alert-warn">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-semibold">Write this down — nowhere else</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Anyone with these 12 words controls your funds. MultiVault cannot recover a lost phrase.
                  </p>
                </div>
              </div>
            </div>

            <Panel className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
              {words.map((word, index) => (
                <div
                  key={`${word}-${index}`}
                  className="border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2.5 text-sm font-medium"
                >
                  <span className="mr-2 font-mono text-[var(--muted)]">{index + 1}.</span>
                  {word}
                </div>
              ))}
            </Panel>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(seedPhrase)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy phrase
              </Button>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border)] p-4">
              <input
                type="checkbox"
                checked={writtenDown}
                onChange={(e) => setWrittenDown(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm">I have written down my seed phrase and stored it safely offline</span>
            </label>

            <Button size="lg" className="w-full" disabled={!writtenDown} onClick={() => setStep("secure")}>
              Continue to password
            </Button>
          </div>
        )}

        {step === "secure" && (
          <Panel className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">Encrypt your wallet</h2>
            <p className="text-sm text-[var(--muted)]">
              This password unlocks signing and exports. It is separate from your seed phrase.
            </p>
            {isAdding && (
              <>
                <label className="mv-label">Wallet name</label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={`Wallet ${vaultWalletCount() + 1}`}
                />
              </>
            )}
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
            <Button size="lg" className="w-full" onClick={handleFinish} disabled={loading}>
              {loading ? "Securing wallet…" : "Create wallet"}
            </Button>
          </Panel>
        )}

        {step === "username" && createdAddress && (
          <UsernamePicker
            onSubmit={async (username) => {
              await saveUsernameForWallet(createdAddress, username);
              setStep("done");
            }}
          />
        )}

        {step === "done" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gain)]/40 bg-[var(--gain-soft)]">
              <CheckCircle2 className="h-8 w-8 text-[var(--gain)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Wallet ready</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Your wallet is encrypted and added to your vault. Drag it between active, source, and destination zones in Portfolio → Wallets.
              </p>
              {createdAddress && (
                <p className="mt-3 font-mono text-xs text-[var(--primary)]">
                  SOL {createdAddress.slice(0, 6)}…{createdAddress.slice(-4)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={() => { window.location.href = "/dashboard?tab=overview&wallets=1&welcome=1"; }}>
                Open Portfolio → Wallets
              </Button>
              <Button variant="secondary" size="lg" onClick={() => { window.location.href = "/create?add=1"; }}>
                Add another wallet
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}