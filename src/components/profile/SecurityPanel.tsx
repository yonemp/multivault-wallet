"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { PasswordConfirmModal } from "@/components/wallet/PasswordConfirmModal";
import { TwoFactorModal } from "@/components/profile/TwoFactorModal";
import { usePasswordPrompt } from "@/hooks/usePasswordPrompt";
import { loadEncryptedWallet } from "@/lib/wallet/storage";
import { changeWalletPassword, verifyWalletPassword } from "@/lib/wallet/verify-password";
import { clearVerificationCode } from "@/lib/platform/two-factor";
import { AlertTriangle, Copy, Download, Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";

const DISCLAIMERS = [
  "I understand that anyone with my recovery phrase can steal all my funds permanently.",
  "I understand MultiVault cannot recover my wallet if I lose my seed phrase or password.",
  "I will store my backup offline in a secure location — never in screenshots, email, or cloud notes.",
];

type SecurityPanelProps = {
  email?: string;
  phone?: string;
  isLocalWallet?: boolean;
};

export function SecurityPanel({ email, phone, isLocalWallet }: SecurityPanelProps) {
  const [showSeed, setShowSeed] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [checks, setChecks] = useState([false, false, false]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordNote, setPasswordNote] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [pendingNewPassword, setPendingNewPassword] = useState<string | null>(null);

  const passwordPrompt = usePasswordPrompt();
  const allChecked = checks.every(Boolean);
  const has2faContact = Boolean(email?.trim() || phone?.trim());

  function toggleCheck(i: number) {
    setChecks((prev) => prev.map((c, idx) => (idx === i ? !c : c)));
  }

  function requestSeedReveal() {
    passwordPrompt.requestPassword({
      title: "Reveal recovery phrase",
      description: "Enter your wallet password to view your seed phrase.",
      confirmLabel: "Reveal",
      action: async (password) => {
        const phrase = await verifyWalletPassword(password, { persist: true });
        setMnemonic(phrase);
      },
    });
  }

  async function copySeed() {
    if (!mnemonic) return;
    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportSeedPhrase() {
    if (!mnemonic) return;
    const date = new Date().toISOString().slice(0, 10);
    const content = [
      "MULTIVAULT RECOVERY PHRASE BACKUP",
      "=================================",
      `Exported: ${new Date().toLocaleString()}`,
      "",
      "WARNING: Anyone with this phrase controls your funds.",
      "Store offline. Never share. MultiVault cannot recover lost phrases.",
      "",
      "RECOVERY PHRASE (write in order):",
      "",
      mnemonic,
      "",
      "--- END ---",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `multivault-seed-phrase-${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadEncryptedBackup() {
    const payload = loadEncryptedWallet();
    if (!payload) {
      setError("No encrypted wallet found on this device");
      return;
    }
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `multivault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function applyPasswordChange() {
    if (!pendingNewPassword) return;
    await changeWalletPassword(currentPassword, pendingNewPassword);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPendingNewPassword(null);
    clearVerificationCode();
    setPasswordChanged(true);
    setTimeout(() => setPasswordChanged(false), 3000);
  }

  function handleChangePassword() {
    setError(null);
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (has2faContact) {
      setPendingNewPassword(newPassword);
      setShow2fa(true);
      return;
    }

    void changeWalletPassword(currentPassword, newPassword)
      .then(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordChanged(true);
        setTimeout(() => setPasswordChanged(false), 3000);
      })
      .catch(() => setError("Current password is incorrect"));
  }

  const words = mnemonic?.split(" ") ?? [];

  return (
    <div className="space-y-4">
      <Panel className="mv-glass p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldAlert className="h-4 w-4 text-[var(--warning)]" />
          Critical — read before backing up
        </h2>
        <ul className="mt-3 space-y-2 text-xs text-[var(--muted)]">
          <li>· Your <strong className="text-[var(--foreground)]">recovery phrase</strong> is the master key to all chains in this wallet.</li>
          <li>· If you lose it, your funds are <strong className="text-[var(--loss)]">gone forever</strong>. MultiVault cannot reset or recover it.</li>
          <li>· Never share your phrase with anyone — including support staff or &quot;admin&quot; messages.</li>
          <li>· Write it on paper. Store copies in separate secure locations. Do not save in cloud drives or photos.</li>
          <li>· Your wallet password is only required for withdrawals, deleting wallets, and changing contact info — not for browsing or trading.</li>
        </ul>
      </Panel>

      {isLocalWallet && (
        <Panel className="mv-glass space-y-4 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="h-4 w-4 text-[var(--primary)]" />
            Change wallet password
          </h3>
          <p className="text-xs text-[var(--muted)]">
            {has2faContact
              ? "Verification via your saved phone or email is required before changing your password."
              : "Add phone or email in Profile to enable 2FA for password changes."}
          </p>
          <div>
            <label className="mv-label">Current password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="mv-label">New password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mv-label">Confirm new password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="mv-alert-error text-xs">{error}</p>}
          {passwordChanged && <p className="mv-alert-success text-xs">Password updated</p>}
          <Button onClick={handleChangePassword} disabled={!currentPassword || !newPassword}>
            Update password
          </Button>
        </Panel>
      )}

      <Panel className="mv-glass space-y-4 p-5">
        <h3 className="text-sm font-semibold">Recovery phrase backup</h3>
        <p className="text-xs text-[var(--muted)]">
          Confirm each statement below, then enter your password to reveal your seed phrase.
        </p>

        {!mnemonic && (
          <Button variant="secondary" onClick={requestSeedReveal}>
            Enter password to back up phrase
          </Button>
        )}

        <div className="space-y-2">
          {DISCLAIMERS.map((text, i) => (
            <label
              key={text}
              className="flex cursor-pointer items-start gap-2 rounded border border-[var(--border)] p-3 text-xs transition hover:border-[var(--border-strong)]"
            >
              <input
                type="checkbox"
                checked={checks[i]}
                onChange={() => toggleCheck(i)}
                disabled={!mnemonic}
                className="mt-0.5 accent-[var(--primary)]"
              />
              <span className="text-[var(--muted)]">{text}</span>
            </label>
          ))}
        </div>

        {mnemonic && allChecked && (
          <div className="space-y-3">
            <div className="mv-alert-warn flex items-start gap-2 text-xs">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Do not screenshot this screen. Clear your clipboard after copying.
            </div>

            <div className="relative">
              <div
                className={`grid grid-cols-2 gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-4 sm:grid-cols-3 ${
                  !showSeed ? "blur-md select-none" : ""
                }`}
              >
                {words.map((word, i) => (
                  <div key={i} className="font-mono text-sm">
                    <span className="mr-2 text-[var(--muted-dim)]">{i + 1}.</span>
                    {word}
                  </div>
                ))}
              </div>
              {!showSeed && (
                <button
                  type="button"
                  onClick={() => setShowSeed(true)}
                  className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--foreground)]"
                >
                  <Eye className="h-4 w-4" /> Tap to reveal seed phrase
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={copySeed} className="flex items-center gap-1">
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy phrase"}
              </Button>
              <Button variant="outline" onClick={exportSeedPhrase} className="flex items-center gap-1">
                <Download className="h-3.5 w-3.5" />
                Export .txt backup
              </Button>
              <Button variant="ghost" onClick={() => setShowSeed(false)} className="flex items-center gap-1">
                <EyeOff className="h-3.5 w-3.5" /> Hide
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <Panel className="mv-glass space-y-4 p-5">
        <h3 className="text-sm font-semibold">Encrypted wallet file</h3>
        <p className="text-xs text-[var(--muted)]">
          Download your password-encrypted wallet blob. You still need your password to decrypt it.
        </p>
        <div>
          <label className="mv-label">Password reminder (optional note)</label>
          <Input
            type="password"
            value={passwordNote}
            onChange={(e) => setPasswordNote(e.target.value)}
            placeholder="Remind yourself which password encrypts this file"
          />
        </div>
        {error && !isLocalWallet && <p className="mv-alert-error text-xs">{error}</p>}
        <Button variant="outline" onClick={downloadEncryptedBackup} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download encrypted backup
        </Button>
      </Panel>

      <PasswordConfirmModal
        open={passwordPrompt.open}
        title={passwordPrompt.title}
        description={passwordPrompt.description}
        confirmLabel={passwordPrompt.confirmLabel}
        onClose={passwordPrompt.close}
        onConfirm={passwordPrompt.confirm}
      />

      <TwoFactorModal
        open={show2fa}
        email={email}
        phone={phone}
        onClose={() => {
          setShow2fa(false);
          setPendingNewPassword(null);
        }}
        onVerified={() => {
          setShow2fa(false);
          void applyPasswordChange().catch(() => setError("Current password is incorrect"));
        }}
      />
    </div>
  );
}