"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  TwoFactorChannel,
  fetchVerificationChannels,
  sendVerificationCode,
  verifyCode,
} from "@/lib/platform/two-factor";
import { Mail, Phone, Shield } from "lucide-react";

type TwoFactorModalProps = {
  open: boolean;
  email?: string | null;
  phone?: string | null;
  purpose?: "2fa" | "contact";
  onClose: () => void;
  onVerified: () => void;
};

export function TwoFactorModal({
  open,
  email,
  phone,
  purpose = "2fa",
  onClose,
  onVerified,
}: TwoFactorModalProps) {
  const hasEmail = Boolean(email?.trim());
  const hasPhone = Boolean(phone?.trim());
  const [channel, setChannel] = useState<TwoFactorChannel>("email");
  const [channelsReady, setChannelsReady] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [masked, setMasked] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchVerificationChannels().then((c) => {
      setEmailEnabled(c.email);
      setSmsEnabled(c.sms);
      setChannelsReady(true);
      if (hasEmail && c.email) setChannel("email");
      else if (hasPhone && c.sms) setChannel("phone");
    });
  }, [open, hasEmail, hasPhone]);

  if (!open) return null;

  const canUseEmail = hasEmail && emailEnabled;
  const canUsePhone = hasPhone && smsEnabled;
  const destination = channel === "email" ? email!.trim() : phone!.trim();

  async function handleSend() {
    setError(null);
    setBusy(true);
    try {
      const result = await sendVerificationCode(channel, destination, purpose);
      setMasked(result.masked);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setBusy(true);
    try {
      const ok = await verifyCode(channel, destination, code, purpose);
      if (!ok) {
        setError("Invalid or expired code");
        return;
      }
      onVerified();
      setCode("");
      setSent(false);
    } catch {
      setError("Verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm border border-[var(--border-strong)] bg-[var(--surface-solid)] p-5 shadow-[var(--shadow-xl)]">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold">Verify it&apos;s you</h3>
        </div>
        <p className="mb-4 text-xs text-[var(--muted)]">
          Choose email or phone — we&apos;ll send a real 6-digit code.
        </p>

        {!channelsReady ? (
          <p className="text-xs text-[var(--muted)]">Checking available channels…</p>
        ) : !canUseEmail && !canUsePhone ? (
          <p className="mv-alert-error text-xs">
            Verification isn&apos;t configured yet. Add Resend (email) or Twilio (SMS) keys in Vercel env.
          </p>
        ) : (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!canUseEmail}
              onClick={() => { setChannel("email"); setSent(false); setCode(""); setError(null); }}
              className={`flex items-center justify-center gap-1.5 border px-3 py-2.5 text-xs font-semibold transition ${
                channel === "email" && canUseEmail
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              } ${!canUseEmail ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
            <button
              type="button"
              disabled={!canUsePhone}
              onClick={() => { setChannel("phone"); setSent(false); setCode(""); setError(null); }}
              className={`flex items-center justify-center gap-1.5 border px-3 py-2.5 text-xs font-semibold transition ${
                channel === "phone" && canUsePhone
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              } ${!canUsePhone ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <Phone className="h-3.5 w-3.5" /> SMS
            </button>
          </div>
        )}

        {channelsReady && (canUseEmail || canUsePhone) && !sent && (
          <Button
            className="w-full"
            onClick={() => void handleSend()}
            disabled={busy || (channel === "email" ? !canUseEmail : !canUsePhone)}
          >
            {busy ? "Sending…" : `Send code via ${channel === "email" ? "email" : "SMS"}`}
          </Button>
        )}

        {sent && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--muted)]">Code sent to {masked}</p>
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null); }}
              placeholder="6-digit code"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              onKeyDown={(e) => e.key === "Enter" && void handleVerify()}
            />
            {error && <p className="mv-alert-error text-xs">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => void handleVerify()} disabled={busy || code.length < 6}>
                {busy ? "Checking…" : "Verify"}
              </Button>
            </div>
            <button
              type="button"
              onClick={() => { setSent(false); setCode(""); }}
              className="w-full text-[10px] text-[var(--primary)] hover:underline"
            >
              Resend to {channel === "email" ? "email" : "phone"}
            </button>
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