"use client";

import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { ShieldAlert } from "lucide-react";

type Props = {
  username?: string | null;
  reason?: string | null;
  onLogout: () => void;
};

export function FrozenAccountGate({ username, reason, onLogout }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Panel className="max-w-md space-y-4 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--loss)]/40 bg-[var(--loss-soft)]">
          <ShieldAlert className="h-7 w-7 text-[var(--loss)]" />
        </div>
        <h1 className="text-xl font-semibold">Account frozen</h1>
        {username && (
          <p className="text-sm text-[var(--muted)]">
            User <span className="font-semibold text-[var(--text)]">@{username}</span>
          </p>
        )}
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          {reason?.trim() ||
            "This account has been frozen by an administrator. Trading and transfers are disabled."}
        </p>
        <p className="text-xs text-[var(--muted)]">
          Open a support ticket from another device or contact support if you believe this is a mistake.
        </p>
        <Button variant="secondary" className="w-full" onClick={onLogout}>
          Sign out
        </Button>
      </Panel>
    </main>
  );
}