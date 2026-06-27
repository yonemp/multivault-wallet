"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { LOCK_TIMEOUT_MS } from "@/lib/wallet/wallet-lock";
import { getUnlockedMnemonic } from "@/lib/wallet/unlock-store";
import { loadEncryptedWallet } from "@/lib/wallet/storage";
import { AlertTriangle, Copy, Download, Eye, EyeOff, ShieldAlert } from "lucide-react";

const DISCLAIMERS = [
  "I understand that anyone with my recovery phrase can steal all my funds permanently.",
  "I understand MultiVault cannot recover my wallet if I lose my seed phrase or password.",
  "I will store my backup offline in a secure location — never in screenshots, email, or cloud notes.",
];

export function SecurityPanel() {
  const [showSeed, setShowSeed] = useState(false);
  const [password, setPassword] = useState("");
  const [checks, setChecks] = useState([false, false, false]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mnemonic = getUnlockedMnemonic();
  const allChecked = checks.every(Boolean);
  const lockMins = LOCK_TIMEOUT_MS / 60_000;

  function toggleCheck(i: number) {
    setChecks((prev) => prev.map((c, idx) => (idx === i ? !c : c)));
  }

  async function copySeed() {
    if (!mnemonic) return;
    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <li>· Your wallet auto-locks after <strong className="text-[var(--foreground)]">{lockMins} minutes</strong> of inactivity. You can browse while locked; only signing requires unlock.</li>
        </ul>
      </Panel>

      <Panel className="mv-glass space-y-4 p-5">
        <h3 className="text-sm font-semibold">Recovery phrase backup</h3>
        <p className="text-xs text-[var(--muted)]">
          Unlock your wallet first, then confirm each statement below to reveal your seed phrase.
        </p>

        {!mnemonic && (
          <div className="mv-alert-warn text-xs">
            Wallet is locked. Go to the dashboard and unlock to back up your recovery phrase.
          </div>
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
          This is not a substitute for saving your recovery phrase.
        </p>
        <div>
          <label className="mv-label">Confirm password (optional note)</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Remind yourself which password encrypts this file"
          />
        </div>
        {error && <p className="mv-alert-error text-xs">{error}</p>}
        <Button variant="outline" onClick={downloadEncryptedBackup} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download encrypted backup
        </Button>
      </Panel>
    </div>
  );
}