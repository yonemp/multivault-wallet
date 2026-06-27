"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock } from "lucide-react";

type UnlockGateProps = {
  locked: boolean;
  password: string;
  onPasswordChange: (v: string) => void;
  onUnlock: () => void;
  error?: string | null;
  action: string;
  children: ReactNode;
};

export function UnlockGate({
  locked,
  password,
  onPasswordChange,
  onUnlock,
  error,
  action,
  children,
}: UnlockGateProps) {
  if (!locked) return <>{children}</>;

  return (
    <div className="mv-panel flex flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--warning)]/15">
        <Lock className="h-5 w-5 text-[var(--warning)]" />
      </div>
      <div>
        <p className="text-sm font-semibold">Unlock required</p>
        <p className="mt-1 max-w-sm text-xs text-[var(--muted)]">
          Your wallet is locked for security. Enter your password to {action}.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Wallet password"
          onKeyDown={(e) => e.key === "Enter" && onUnlock()}
        />
        {error && <p className="mv-alert-error text-xs">{error}</p>}
        <Button onClick={onUnlock}>Unlock wallet</Button>
      </div>
    </div>
  );
}