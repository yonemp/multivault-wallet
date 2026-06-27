"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Shield, Unlock } from "lucide-react";

type HeaderWalletLockProps = {
  show: boolean;
  locked: boolean;
  password: string;
  onPasswordChange: (v: string) => void;
  onUnlock: () => void;
  onLock?: () => void;
  error?: string | null;
  remaining?: string;
};

export function HeaderWalletLock({
  show,
  locked,
  password,
  onPasswordChange,
  onUnlock,
  onLock,
  error,
  remaining,
}: HeaderWalletLockProps) {
  if (!show) return null;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
        locked
          ? "border-[var(--warning)]/50 bg-[rgba(245,166,35,0.1)]"
          : "border-[var(--gain)]/40 bg-[var(--gain-soft)]"
      }`}
    >
      {locked ? (
        <Lock className="h-4 w-4 shrink-0 text-[var(--warning)]" />
      ) : (
        <Shield className="h-4 w-4 shrink-0 text-[var(--gain)]" />
      )}

      <div className="hidden min-w-0 sm:block">
        <p className="text-[11px] font-semibold leading-tight">
          {locked ? "Locked" : "Unlocked"}
        </p>
        <p className="text-[9px] leading-tight text-[var(--muted)]">
          {locked ? "Enter password" : remaining === "on terminal" ? "Unlocked on terminal" : remaining ? `${remaining} away` : "Locks after 5m away"}
        </p>
      </div>

      {locked ? (
        <>
          <Input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Password"
            className="!w-28 !py-1.5 text-xs lg:!w-32"
            onKeyDown={(e) => e.key === "Enter" && onUnlock()}
          />
          {error && <span className="text-[9px] text-[var(--loss)]">{error}</span>}
          <Button size="sm" onClick={onUnlock} className="!px-2.5">
            <Unlock className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        onLock && (
          <button
            type="button"
            onClick={onLock}
            title="Lock wallet"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-base transition hover:border-[var(--warning)] hover:bg-[var(--warning)]/10"
          >
            🔒
          </button>
        )
      )}
    </div>
  );
}