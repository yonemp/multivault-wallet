"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Shield, Unlock } from "lucide-react";

type LockBannerProps = {
  locked: boolean;
  password: string;
  onPasswordChange: (v: string) => void;
  onUnlock: () => void;
  onLock?: () => void;
  error?: string | null;
  remaining?: string;
};

export function LockBanner({
  locked,
  password,
  onPasswordChange,
  onUnlock,
  onLock,
  error,
  remaining,
}: LockBannerProps) {
  if (!locked && !onLock) return null;

  return (
    <div
      className={`mb-3 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2.5 backdrop-blur-md ${
        locked
          ? "border-[var(--warning)]/40 bg-[rgba(245,166,35,0.08)]"
          : "border-[var(--gain)]/30 bg-[var(--gain-soft)]"
      }`}
    >
      <div className="flex items-center gap-2">
        {locked ? (
          <Lock className="h-4 w-4 text-[var(--warning)]" />
        ) : (
          <Shield className="h-4 w-4 text-[var(--gain)]" />
        )}
        <div>
          <p className="text-xs font-semibold">
            {locked ? "Wallet locked â€” view-only mode" : "Wallet unlocked"}
          </p>
          <p className="text-[10px] text-[var(--muted)]">
            {locked
              ? "Browse freely. Unlock to send, swap, or trade on-chain."
              : `Auto-locks after 5 min idle${remaining ? ` · ${remaining} left` : ""}`}
          </p>
        </div>
      </div>

      {locked ? (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Password"
            className="!w-36 !py-1.5 text-xs"
            onKeyDown={(e) => e.key === "Enter" && onUnlock()}
          />
          {error && <span className="text-[10px] text-[var(--loss)]">{error}</span>}
          <Button size="sm" onClick={onUnlock} className="flex items-center gap-1">
            <Unlock className="h-3 w-3" /> Unlock
          </Button>
        </div>
      ) : (
        onLock && (
          <Button size="sm" variant="ghost" onClick={onLock} className="ml-auto text-[10px]">
            Lock now
          </Button>
        )
      )}
    </div>
  );
}