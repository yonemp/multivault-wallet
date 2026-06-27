"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import {
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

const STATUS_STYLES: Record<UserTicketView["status"], string> = {
  open: "border-[var(--warning)] bg-[rgba(245,166,35,0.1)] text-[var(--warning)]",
  answered: "border-[var(--gain)] bg-[var(--gain-soft)] text-[var(--gain)]",
  closed: "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--muted)]",
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
        Admin replies appear here when your ticket is answered.
      </p>

      {setupRequired && (
        <p className="text-xs text-[var(--warning)]">
          Cloud inbox is not configured yet — showing tickets saved on this device.
        </p>
      )}

      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={`${t.id}-${t.createdAt}`} className="border border-[var(--border)] p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold">{t.subject}</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                  {new Date(t.createdAt).toLocaleString()}
                  {t.source === "local" ? " · queued locally" : ""}
                </p>
              </div>
              <span className={`border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[t.status]}`}>
                {t.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">{t.body}</p>
            {t.adminReply ? (
              <div className="mv-alert-info mt-3 text-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">Support reply</p>
                <p className="mt-1">{t.adminReply}</p>
              </div>
            ) : t.status === "open" ? (
              <p className="mt-3 text-[10px] text-[var(--muted-dim)]">Waiting for support…</p>
            ) : null}
          </div>
        ))}

        {!loading && !tickets.length && (
          <p className="py-6 text-center text-sm text-[var(--muted)]">
            No tickets yet. Submit one below and check back here for replies.
          </p>
        )}
        {loading && !tickets.length && (
          <p className="py-6 text-center text-sm text-[var(--muted)]">Loading tickets…</p>
        )}
      </div>
    </Panel>
  );
}