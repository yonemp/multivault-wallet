"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock } from "lucide-react";

type PasswordConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
};

export function PasswordConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  onClose,
  onConfirm,
}: PasswordConfirmModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    if (!password) {
      setError("Enter your wallet password");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onConfirm(password);
      setPassword("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Incorrect password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm border border-[var(--border-strong)] bg-[var(--surface-solid)] p-5 shadow-[var(--shadow-xl)]">
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <p className="mb-4 text-xs text-[var(--muted)]">{description}</p>
        <Input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          placeholder="Wallet password"
          autoComplete="current-password"
          onKeyDown={(e) => e.key === "Enter" && void handleConfirm()}
        />
        {error && <p className="mv-alert-error mt-2 text-xs">{error}</p>}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => void handleConfirm()} disabled={busy}>
            {busy ? "Verifying…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}