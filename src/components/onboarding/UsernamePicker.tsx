"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { validateUsername } from "@/lib/platform/username";
import type { ProfileVisibility } from "@/lib/platform/user-profile";
import { Globe, Lock, User } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  submitLabel?: string;
  loading?: boolean;
  showVisibility?: boolean;
  onSubmit: (username: string, profileVisibility: ProfileVisibility) => void | Promise<void>;
};

export function UsernamePicker({
  title = "Pick your username",
  description = "Required for your wallet profile and so friends can find you. You can set your profile public or private.",
  submitLabel = "Continue",
  loading = false,
  showVisibility = true,
  onSubmit,
}: Props) {
  const [username, setUsername] = useState("");
  const [visibility, setVisibility] = useState<ProfileVisibility>("public");
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
      await onSubmit(username, visibility);
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
        <label className="mv-label">Username *</label>
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

      {showVisibility && (
        <div>
          <label className="mv-label">Profile visibility</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`flex items-start gap-2 border p-3 text-left text-xs transition ${
                visibility === "public"
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-[var(--border)] hover:border-[var(--border-strong)]"
              }`}
            >
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
              <div>
                <p className="font-semibold">Public</p>
                <p className="mt-0.5 text-[var(--muted)]">Anyone can find and add you by username</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={`flex items-start gap-2 border p-3 text-left text-xs transition ${
                visibility === "private"
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-[var(--border)] hover:border-[var(--border-strong)]"
              }`}
            >
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
              <div>
                <p className="font-semibold">Private</p>
                <p className="mt-0.5 text-[var(--muted)]">Hidden from search — only existing friends can interact</p>
              </div>
            </button>
          </div>
        </div>
      )}

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