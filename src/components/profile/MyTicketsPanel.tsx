"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { TicketConversation } from "@/components/profile/TicketConversation";
import {
  appendLocalTicketMessage,
  closeLocalTicket,
  loadLocalTickets,
  mergeTicketsForUser,
  syncLocalTicketsFromRemote,
  type RemoteSupportTicket,
  type UserTicketView,
} from "@/lib/platform/support-tickets-local";
import { Inbox, RefreshCw } from "lucide-react";

type MyTicketsPanelProps = {
  wallet: string | null;
  username: string | null;
  refreshKey?: number;
};

export function MyTicketsPanel({ wallet, username, refreshKey = 0 }: MyTicketsPanelProps) {
  const [tickets, setTickets] = useState<UserTicketView[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (wallet) params.set("wallet", wallet);
    if (username) params.set("username", username);

    let remote: RemoteSupportTicket[] = [];
    let cloudDown = false;

    if (params.toString()) {
      try {
        const res = await fetch(`/api/tickets?${params}`);
        const data = (await res.json().catch(() => ({}))) as {
          tickets?: RemoteSupportTicket[];
          setupRequired?: boolean;
        };
        if (res.ok) {
          remote = data.tickets ?? [];
          setSetupRequired(data.setupRequired === true);
          syncLocalTicketsFromRemote(remote);
        } else {
          cloudDown = true;
        }
      } catch {
        cloudDown = true;
      }
    }

    const local = loadLocalTickets();
    setTickets(mergeTicketsForUser(local, remote, wallet, username));
    if (cloudDown && !remote.length) setSetupRequired(true);
    setLoading(false);
  }, [wallet, username]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets, refreshKey]);

  async function handleLocalMessage(ticket: UserTicketView, body: string) {
    const id = ticket.localId ?? ticket.id;
    appendLocalTicketMessage(id, "user", body);
    await loadTickets();
  }

  async function handleLocalClose(ticket: UserTicketView) {
    const id = ticket.localId ?? ticket.id;
    closeLocalTicket(id);
    await loadTickets();
  }

  return (
    <Panel className="mv-glass space-y-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Inbox className="h-4 w-4 text-[var(--primary)]" /> My tickets
        </h2>
        <button
          type="button"
          onClick={() => void loadTickets()}
          disabled={loading}
          className="flex items-center gap-1 border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--primary)]"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Keep the conversation going until you or support closes the ticket.
      </p>

      {setupRequired && (
        <p className="text-xs text-[var(--warning)]">
          Cloud inbox is not fully configured — local tickets work on this device only.
        </p>
      )}

      <div className="space-y-3">
        {tickets.map((t) =>
          t.source === "local" ? (
            <LocalTicketConversation
              key={`${t.id}-${t.createdAt}`}
              ticket={t}
              onMessage={(body) => handleLocalMessage(t, body)}
              onClose={() => handleLocalClose(t)}
            />
          ) : (
            <TicketConversation
              key={`${t.id}-${t.createdAt}`}
              ticketId={t.id}
              subject={t.subject}
              status={t.status}
              messages={t.messages}
              source={t.source}
              canReply={t.canReply}
              wallet={wallet}
              username={username}
              onUpdated={() => void loadTickets()}
            />
          ),
        )}

        {!loading && !tickets.length && (
          <p className="py-6 text-center text-sm text-[var(--muted)]">
            No tickets yet. Submit one on the right and chat here until it&apos;s resolved.
          </p>
        )}
        {loading && !tickets.length && (
          <p className="py-6 text-center text-sm text-[var(--muted)]">Loading tickets…</p>
        )}
      </div>
    </Panel>
  );
}

function LocalTicketConversation({
  ticket,
  onMessage,
  onClose,
}: {
  ticket: UserTicketView;
  onMessage: (body: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="border border-[var(--border)] p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{ticket.subject}</p>
        <span className="border border-[var(--warning)] bg-[rgba(245,166,35,0.1)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--warning)]">
          {ticket.status}
        </span>
      </div>
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto border border-[var(--border)] bg-[var(--surface-solid)] p-2">
        {ticket.messages.map((m) => (
          <div key={m.id} className="rounded bg-[var(--surface)] px-2 py-1.5 text-xs">
            <p className="text-[9px] font-semibold uppercase text-[var(--muted)]">
              {m.role === "admin" ? "Support" : "You"}
            </p>
            <p className="mt-0.5 whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>
      {ticket.status === "open" && (
        <div className="mt-3 flex gap-2">
          <input
            className="mv-input flex-1 !py-1.5 text-xs"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Follow-up (saved locally)…"
          />
          <button
            type="button"
            className="border border-[var(--primary)] px-2 py-1 text-[10px] font-semibold text-[var(--primary)]"
            onClick={() => {
              if (!draft.trim()) return;
              onMessage(draft.trim());
              setDraft("");
            }}
          >
            Send
          </button>
          <button
            type="button"
            className="border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)]"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}