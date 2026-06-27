"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { TicketMessage } from "@/lib/platform/ticket-messages";
import type { TicketStatus } from "@/lib/platform/ticket-messages";

type TicketConversationProps = {
  ticketId: string;
  subject: string;
  status: TicketStatus;
  messages: TicketMessage[];
  source: "cloud" | "local";
  canReply: boolean;
  wallet: string | null;
  username: string | null;
  onUpdated: () => void;
  adminMode?: boolean;
  adminKey?: string;
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "border-[var(--warning)] bg-[rgba(245,166,35,0.1)] text-[var(--warning)]",
  closed: "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--muted)]",
};

export function TicketConversation({
  ticketId,
  subject,
  status,
  messages,
  source,
  canReply,
  wallet,
  username,
  onUpdated,
  adminMode = false,
  adminKey,
}: TicketConversationProps) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage() {
    if (!draft.trim() || status === "closed") return;
    setBusy(true);
    setError(null);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (adminMode && adminKey) headers["x-admin-key"] = adminKey;

    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: ticketId,
          action: "message",
          body: draft.trim(),
          wallet: adminMode ? undefined : wallet,
          username: adminMode ? undefined : username,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to send message");
        return;
      }
      setDraft("");
      onUpdated();
    } catch {
      setError("Could not reach server");
    } finally {
      setBusy(false);
    }
  }

  async function closeTicket() {
    if (status === "closed") return;
    setBusy(true);
    setError(null);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (adminMode && adminKey) headers["x-admin-key"] = adminKey;

    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: ticketId,
          action: "close",
          wallet: adminMode ? undefined : wallet,
          username: adminMode ? undefined : username,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to close ticket");
        return;
      }
      onUpdated();
    } catch {
      setError("Could not reach server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-[var(--border)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{subject}</p>
          <p className="mt-0.5 text-[10px] text-[var(--muted)]">
            {source === "local" ? "Queued locally · " : ""}
            {status === "open" ? "Conversation open" : "Closed"}
          </p>
        </div>
        <span className={`border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[status]}`}>
          {status}
        </span>
      </div>

      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto border border-[var(--border)] bg-[var(--surface-solid)] p-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded px-2 py-1.5 text-xs ${
              m.role === "admin"
                ? "ml-4 border-l-2 border-[var(--primary)] bg-[var(--primary-soft)]"
                : "mr-4 border-l-2 border-[var(--border)] bg-[var(--surface)]"
            }`}
          >
            <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              {m.role === "admin" ? "Support" : "You"} · {new Date(m.created_at).toLocaleString()}
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-[var(--foreground)]">{m.body}</p>
          </div>
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-[var(--loss)]">{error}</p>}

      {canReply && status === "open" && (
        <div className="mt-3 space-y-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={adminMode ? "Reply to userâ€¦" : "Ask a follow-upâ€¦"}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void sendMessage()} disabled={busy || !draft.trim()}>
              {adminMode ? "Send reply" : "Send message"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void closeTicket()} disabled={busy}>
              Close ticket
            </Button>
          </div>
        </div>
      )}

      {status === "closed" && (
        <p className="mt-3 text-[10px] text-[var(--muted-dim)]">This ticket is closed. Open a new ticket for a new issue.</p>
      )}
    </div>
  );
}