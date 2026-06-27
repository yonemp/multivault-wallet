"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TwoFactorChannel, sendVerificationCode, verifyCode } from "@/lib/platform/two-factor";
import { Shield } from "lucide-react";

type TwoFactorModalProps = {
  open: boolean;
  email?: string | null;
  phone?: string | null;
  onClose: () => void;
  onVerified: () => void;
};

export function TwoFactorModal({
  open,
  email,
  phone,
  onClose,
  onVerified,
}: TwoFactorModalProps) {
  const hasEmail = Boolean(email?.trim());
  const hasPhone = Boolean(phone?.trim());
  const [channel, setChannel] = useState<TwoFactorChannel>(hasEmail ? "email" : "phone");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [masked, setMasked] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const destination = channel === "email" ? email!.trim() : phone!.trim();

  async function handleSend() {
    setError(null);
    setBusy(true);
    try {
      const result = sendVerificationCode(channel, destination);
      setMasked(result.masked);
      setDevCode(result.devCode ?? null);
      setSent(true);
    } catch {
      setError("Failed to send code");
    } finally {
      setBusy(false);
    }
  }

  function handleVerify() {
    setError(null);
    if (!verifyCode(channel, destination, code)) {
      setError("Invalid or expired code");
      return;
    }
    onVerified();
    setCode("");
    setSent(false);
    setDevCode(null);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm border border-[var(--border-strong)] bg-[var(--surface-solid)] p-5 shadow-[var(--shadow-xl)]">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold">Verify it&apos;s you</h3>
        </div>
        <p className="mb-4 text-xs text-[var(--muted)]">
          Choose where to receive your verification code.
        </p>

        {(hasEmail && hasPhone) && (
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => { setChannel("email"); setSent(false); setCode(""); }}
              className={`flex-1 border px-3 py-2 text-xs font-semibold ${
                channel === "email"
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => { setChannel("phone"); setSent(false); setCode(""); }}
              className={`flex-1 border px-3 py-2 text-xs font-semibold ${
                channel === "phone"
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              Phone
            </button>
          </div>
        )}

        {!sent ? (
          <Button className="w-full" onClick={() => void handleSend()} disabled={busy}>
            {busy ? "Sending…" : `Send code to ${channel === "email" ? "email" : "phone"}`}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[var(--muted)]">
              Code sent to {masked}
              {devCode && (
                <span className="mt-1 block font-mono text-[var(--foreground)]">
                  Demo code: {devCode}
                </span>
              )}
            </p>
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null); }}
              placeholder="6-digit code"
              maxLength={6}
              inputMode="numeric"
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
            {error && <p className="mv-alert-error text-xs">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleVerify} disabled={code.length < 6}>
                Verify
              </Button>
            </div>
          </div>
        )}

        {!sent && (
          <Button variant="ghost" className="mt-2 w-full text-xs" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}