"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { HealthLogPanel } from "@/components/admin/HealthLogPanel";
import { ArrowLeft, Crown, Flag, MessageSquare, Users, Wallet } from "lucide-react";

type WalletRow = {
  id: string;
  address: string;
  chain: string;
  wallet_type: string;
  is_frozen?: boolean;
  frozen_reason?: string;
  created_at: string;
};

type TicketRow = {
  id: string;
  wallet_address?: string;
  subject: string;
  body: string;
  status: string;
  admin_reply?: string;
  created_at: string;
};

type Stats = {
  total: number;
  frozen: number;
  byChain: Record<string, number>;
  byType: Record<string, number>;
};

const EMPTY_STATS: Stats = { total: 0, frozen: 0, byChain: {}, byType: {} };

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [ticketsSetupRequired, setTicketsSetupRequired] = useState(false);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [freezeReason, setFreezeReason] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"overview" | "wallets" | "tickets">("overview");

  async function loadData(key: string, opts?: { skipVerify?: boolean }) {
    const trimmed = key.trim();
    if (!trimmed) {
      setAuthError("Enter your admin secret key.");
      return;
    }

    setLoading(true);
    setAuthError(null);
    setDataError(null);
    setTicketsSetupRequired(false);

    try {
      if (!opts?.skipVerify) {
        const verifyRes = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: trimmed }),
        });
        const verifyBody = (await verifyRes.json().catch(() => ({}))) as { error?: string };
        if (!verifyRes.ok) {
          sessionStorage.removeItem("mv_admin_key");
          setAuthenticated(false);
          setAuthError(
            verifyBody.error
              ?? (verifyRes.status === 401 ? "Invalid admin key." : `Could not verify key (${verifyRes.status}).`),
          );
          return;
        }
      }

      const [wRes, tRes] = await Promise.all([
        fetch("/api/admin/wallets", { headers: { "x-admin-key": trimmed } }),
        fetch("/api/tickets", { headers: { "x-admin-key": trimmed } }),
      ]);

      if (!wRes.ok) {
        const wBody = (await wRes.json().catch(() => ({}))) as { error?: string };
        setAuthenticated(true);
        sessionStorage.setItem("mv_admin_key", trimmed);
        setWallets([]);
        setStats(EMPTY_STATS);
        setTickets([]);
        setDataError(wBody.error ?? `Failed to load wallet data (${wRes.status}).`);
        return;
      }

      const wData = await wRes.json();
      const tData = tRes.ok
        ? ((await tRes.json()) as { tickets?: TicketRow[]; setupRequired?: boolean; hint?: string })
        : { tickets: [] as TicketRow[] };

      setWallets(wData.wallets ?? []);
      setStats(wData.stats ?? EMPTY_STATS);
      setTickets(tData.tickets ?? []);
      setTicketsSetupRequired(tData.setupRequired === true);
      setAuthenticated(true);
      sessionStorage.setItem("mv_admin_key", trimmed);
      if (tData.setupRequired) {
        setDataError(tData.hint ?? "Run supabase/schema-v2.sql in Supabase to enable support tickets.");
      } else if (!tRes.ok) {
        setDataError("Wallet data loaded, but support tickets could not be fetched.");
      }
    } catch {
      sessionStorage.removeItem("mv_admin_key");
      setAuthenticated(false);
      setAuthError("Could not reach server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("mv_admin_key");
    if (saved) {
      setAdminKey(saved);
      loadData(saved);
    }
  }, []);

  async function toggleFreeze(wallet: WalletRow) {
    const key = adminKey;
    const freezing = !wallet.is_frozen;
    await fetch("/api/admin/wallets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({
        address: wallet.address,
        chain: wallet.chain,
        isFrozen: freezing,
        reason: freezeReason[`${wallet.address}-${wallet.chain}`] ?? "Flagged for review",
        frozenBy: "admin",
      }),
    });
    await loadData(key, { skipVerify: true });
  }

  async function replyTicket(ticket: TicketRow) {
    const reply = replyDraft[ticket.id];
    if (!reply?.trim()) return;
    await fetch("/api/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        id: ticket.id,
        status: "answered",
        adminReply: reply,
      }),
    });
    await loadData(adminKey, { skipVerify: true });
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Panel className="w-full max-w-sm space-y-4 p-6 shadow-[var(--shadow-xl)]">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <h1 className="text-lg font-semibold">Admin access</h1>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Enter your admin secret key. Set <code className="text-xs">ADMIN_SECRET</code> in Vercel env.
          </p>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void loadData(adminKey);
            }}
          >
            <Input
              type="password"
              value={adminKey}
              onChange={(e) => {
                setAdminKey(e.target.value);
                if (authError) setAuthError(null);
              }}
              placeholder="Admin secret"
              autoComplete="current-password"
              disabled={loading}
            />
            {authError && (
              <p className="text-sm text-[var(--loss)]" role="alert">
                {authError}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !adminKey.trim()}>
              {loading ? "Verifying…" : "Unlock admin panel"}
            </Button>
          </form>
          <Link href="/dashboard" className="block text-center text-sm text-[var(--muted)] hover:text-[var(--primary)]">
            ← Back to wallet terminal
          </Link>
        </Panel>
      </main>
    );
  }

  return (
    <AppShell showNav={false} terminal={false}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--primary)]">
            <ArrowLeft className="h-4 w-4" /> Wallet
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Crown className="h-5 w-5 text-amber-600" /> Command center
          </h1>
        </div>
        <div className="flex border border-[var(--border)]">
          {(["overview", "wallets", "tickets"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                tab === t ? "bg-[var(--foreground)] text-white" : "bg-[var(--surface-solid)] text-[var(--muted)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {dataError && (
        <p className="mb-4 border border-[var(--warning)] bg-[rgba(245,166,35,0.1)] px-3 py-2 text-sm text-[var(--warning)]" role="alert">
          {dataError}
        </p>
      )}

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Registered wallets", value: (stats ?? EMPTY_STATS).total, icon: Wallet },
              { label: "Frozen flags", value: (stats ?? EMPTY_STATS).frozen, icon: Flag },
              { label: "Open tickets", value: tickets.filter((t) => t.status === "open").length, icon: MessageSquare },
              { label: "Wallet types", value: Object.keys((stats ?? EMPTY_STATS).byType).length, icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="mv-stat-tile flex items-center gap-3 px-4 py-4">
                <Icon className="h-5 w-5 text-[var(--primary)]" />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel className="p-4">
              <h3 className="text-sm font-semibold">By chain</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {Object.entries((stats ?? EMPTY_STATS).byChain).map(([chain, count]) => (
                  <div key={chain} className="flex justify-between border-b border-[var(--border)] pb-2">
                    <dt className="capitalize text-[var(--muted)]">{chain}</dt>
                    <dd className="font-mono font-semibold">{count}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel className="p-4">
              <h3 className="text-sm font-semibold">By wallet type</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {Object.entries((stats ?? EMPTY_STATS).byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between border-b border-[var(--border)] pb-2">
                    <dt className="capitalize text-[var(--muted)]">{type}</dt>
                    <dd className="font-mono font-semibold">{count}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>

          <HealthLogPanel />

          <p className="text-xs text-[var(--muted)]">
            Freezing is an app-level flag for registered addresses. It does not block on-chain transfers in self-custody wallets.
          </p>
        </div>
      )}

      {tab === "wallets" && (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-solid)] text-[11px] uppercase tracking-wider text-[var(--muted)]">
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Chain</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w) => (
                <tr key={w.id} className="border-b border-[var(--border)]">
                  <td className="px-4 py-3 font-mono text-xs">{w.address}</td>
                  <td className="px-4 py-3">{w.chain}</td>
                  <td className="px-4 py-3 capitalize">{w.wallet_type}</td>
                  <td className="px-4 py-3">
                    {w.is_frozen ? (
                      <span className="border border-[var(--loss)] bg-[var(--loss-soft)] px-2 py-0.5 text-xs font-medium text-[var(--loss)]">
                        Frozen
                      </span>
                    ) : (
                      <span className="border border-[var(--gain)] bg-[var(--gain-soft)] px-2 py-0.5 text-xs font-medium text-[var(--gain)]">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!w.is_frozen && (
                        <Input
                          className="!py-1 text-xs"
                          placeholder="Reason"
                          value={freezeReason[`${w.address}-${w.chain}`] ?? ""}
                          onChange={(e) =>
                            setFreezeReason((prev) => ({
                              ...prev,
                              [`${w.address}-${w.chain}`]: e.target.value,
                            }))
                          }
                        />
                      )}
                      <Button
                        size="sm"
                        variant={w.is_frozen ? "secondary" : "ghost"}
                        onClick={() => toggleFreeze(w)}
                      >
                        {w.is_frozen ? "Unfreeze" : "Freeze"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {tab === "tickets" && (
        <div className="space-y-3">
          {ticketsSetupRequired && (
            <Panel className="p-4 text-sm text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">Support tickets database not set up</p>
              <p className="mt-2">
                Run <code className="text-xs">supabase/schema-v2.sql</code> in your Supabase SQL Editor.
                Until then, new tickets are queued in server logs as <code className="text-xs">[support-ticket-fallback]</code>.
              </p>
            </Panel>
          )}
          {tickets.map((t) => (
            <Panel key={t.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{t.subject}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {t.wallet_address ?? "No address"} · {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  t.status === "open" ? "border-[var(--warning)] bg-[rgba(245,166,35,0.1)] text-[var(--warning)]" : "border-[var(--gain)] bg-[var(--gain-soft)] text-[var(--gain)]"
                }`}>
                  {t.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">{t.body}</p>
              {t.admin_reply && (
                <p className="mv-alert-info mt-3 text-sm">Reply: {t.admin_reply}</p>
              )}
              {t.status === "open" && (
                <div className="mt-3 flex gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Admin reply…"
                    value={replyDraft[t.id] ?? ""}
                    onChange={(e) => setReplyDraft((prev) => ({ ...prev, [t.id]: e.target.value }))}
                  />
                  <Button size="sm" onClick={() => replyTicket(t)}>Reply</Button>
                </div>
              )}
            </Panel>
          ))}
          {!tickets.length && <p className="text-sm text-[var(--muted)]">No tickets yet.</p>}
        </div>
      )}
    </AppShell>
  );
}