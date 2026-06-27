"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { validateUsername } from "@/lib/platform/username";
import { User } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  submitLabel?: string;
  loading?: boolean;
  onSubmit: (username: string) => void | Promise<void>;
};

export function UsernamePicker({
  title = "Pick your username",
  description = "This is your account name for support tickets and moderation. You can’t change it later without contacting support.",
  submitLabel = "Continue",
  loading = false,
  onSubmit,
}: Props) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const err = validateUsername(username);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(username);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save username");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Panel className="space-y-4 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary-soft)]">
          <User className="h-5 w-5 text-[var(--primary)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        </div>
      </div>

      <div>
        <label className="mv-label">Username</label>
        <Input
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(null);
          }}
          placeholder="e.g. dreamtrader"
          autoComplete="username"
          maxLength={20}
          className="mt-1"
        />
        <p className="mt-1.5 text-[10px] text-[var(--muted)]">
          3–20 characters · letters, numbers, underscore · starts with a letter
        </p>
      </div>

      {error && <p className="mv-alert-error">{error}</p>}

      <Button
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={loading || submitting || !username.trim()}
      >
        {loading || submitting ? "Saving…" : submitLabel}
      </Button>
    </Panel>
  );
}