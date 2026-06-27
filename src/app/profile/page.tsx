"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SecurityPanel } from "@/components/profile/SecurityPanel";
import { MyTicketsPanel } from "@/components/profile/MyTicketsPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { useWalletLock } from "@/hooks/useWalletLock";
import { loadSession, SessionData, getAddress } from "@/lib/wallet/session";
import {
  loadLocalProfile,
  profileFromApi,
  saveLocalProfile,
} from "@/lib/platform/user-profile";
import { getAccountUsername } from "@/lib/platform/account-username";
import { markTicketSynced, saveLocalTicket } from "@/lib/platform/support-tickets-local";

import { ArrowLeft, MessageSquare, Shield, User } from "lucide-react";

const AVATAR_COLORS = ["#526fff", "#9945FF", "#F7931A", "#00c076", "#ff4d6a", "#F0B90B"];

type ProfileTab = "profile" | "security" | "support";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionData | null>(null);
  const [tab, setTab] = useState<ProfileTab>("profile");
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketBody, setTicketBody] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedLocally, setSavedLocally] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketQueuedLocally, setTicketQueuedLocally] = useState(false);
  const [ticketRefreshKey, setTicketRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const accountUsername = getAccountUsername();

  const lock = useWalletLock(session);

  const primaryAddress =
    session ? getAddress(session, "ethereum") ?? getAddress(session, "solana") : null;

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "support" || tabParam === "security" || tabParam === "profile") {
      setTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      window.location.href = "/";
      return;
    }
    if (!getAccountUsername()) {
      window.location.href = "/onboarding/username?redirect=/profile";
      return;
    }
    setSession(s);

    const addr = getAddress(s, "ethereum") ?? getAddress(s, "solana");
    if (!addr) return;

    const accountName = getAccountUsername() ?? "";
    const local = loadLocalProfile(addr);
    if (local) {
      setDisplayName(local.displayName || accountName);
      setAvatarColor(local.avatarColor);
    } else if (accountName) {
      setDisplayName(accountName);
    }

    fetch(`/api/profile?address=${encodeURIComponent(addr)}`)
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json() as Promise<{ profile?: { display_name?: string | null; avatar_color?: string | null; updated_at?: string | null } | null }>;
      })
      .then((d) => {
        if (!d?.profile) return;
        const remote = profileFromApi(addr, d.profile);
        if (!local || remote.updatedAt >= local.updatedAt) {
          setDisplayName(remote.displayName);
          setAvatarColor(remote.avatarColor);
        }
      })
      .catch(() => {});
  }, []);

  async function saveProfile() {
    if (!primaryAddress) {
      setError("No wallet address found — reconnect your wallet and try again.");
      return;
    }
    setError(null);
    setSavedLocally(false);

    saveLocalProfile({
      primaryAddress,
      displayName: displayName.trim(),
      avatarColor,
    });

    let syncedToCloud = false;
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryAddress,
          displayName: displayName.trim(),
          avatarColor,
        }),
      });
      syncedToCloud = res.ok;
    } catch {
      syncedToCloud = false;
    }

    setSavedLocally(!syncedToCloud);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSavedLocally(false);
    }, 3000);
  }

  async function submitTicket() {
    if (!ticketSubject.trim() || !ticketBody.trim()) {
      setError("Fill in subject and message");
      return;
    }
    setError(null);
    setTicketQueuedLocally(false);

    const username = getAccountUsername();

    const payload = {
      walletAddress: primaryAddress,
      chain: session?.addresses.ethereum ? "ethereum" : "solana",
      username,
      subject: ticketSubject.trim(),
      body: ticketBody.trim(),
    };

    const local = saveLocalTicket({
      walletAddress: payload.walletAddress ?? null,
      chain: payload.chain ?? null,
      username: payload.username,
      subject: payload.subject,
      body: payload.body,
      synced: false,
    });

    let synced = false;
    let setupRequired = false;
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        synced?: boolean;
        setupRequired?: boolean;
        error?: string;
        ticket?: { id?: string };
      };
      if (res.ok) {
        synced = data.synced !== false;
        setupRequired = data.setupRequired === true;
        if (synced) markTicketSynced(local.id, data.ticket?.id);
      } else if (!data.error?.includes("support_tickets")) {
        setError(data.error ?? "Failed to submit ticket");
        return;
      }
    } catch {
      synced = false;
    }

    setTicketSubject("");
    setTicketBody("");
    setTicketQueuedLocally(!synced || setupRequired);
    setTicketSent(true);
    setTicketRefreshKey((k) => k + 1);
    setTimeout(() => {
      setTicketSent(false);
      setTicketQueuedLocally(false);
    }, 5000);
  }

  if (!session) {
    return <main className="flex min-h-screen items-center justify-center">Loading…</main>;
  }

  return (
    <AppShell
      showNav={false}
      terminal={false}
      lockProps={session.mode === "local" ? {
        show: true,
        locked: !lock.unlocked,
        password: lock.password,
        onPasswordChange: lock.setPassword,
        onUnlock: lock.unlock,
        onLock: lock.unlocked ? lock.lock : undefined,
        error: lock.error,
        remaining: lock.remaining,
      } : undefined}
    >
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--primary)]">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="mb-4 flex gap-1 border-b border-[var(--border)]">
        {([
          { id: "profile" as const, label: "Profile", icon: User },
          { id: "support" as const, label: "Support", icon: MessageSquare },
          { id: "security" as const, label: "Security", icon: Shield },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition ${
              tab === id
                ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "security" ? (
        <SecurityPanel />
      ) : tab === "support" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <MyTicketsPanel
            wallet={primaryAddress ?? null}
            username={accountUsername}
            refreshKey={ticketRefreshKey}
          />
          <Panel className="mv-glass space-y-4 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4 text-[var(--primary)]" /> New ticket
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Start a new issue here. Use My tickets to keep chatting until it&apos;s resolved.
            </p>
            <div>
              <label className="mv-label">Subject</label>
              <Input value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="Brief summary" />
            </div>
            <div>
              <label className="mv-label">Message</label>
              <textarea
                value={ticketBody}
                onChange={(e) => setTicketBody(e.target.value)}
                rows={5}
                className="mv-input resize-none"
                placeholder="Describe your issue…"
              />
            </div>
            {error && <p className="mv-alert-error">{error}</p>}
            {ticketSent && (
              <p className="mv-alert-success">
                {ticketQueuedLocally
                  ? "Ticket received — check My tickets for status"
                  : "Ticket submitted — check My tickets for replies"}
              </p>
            )}
            <Button className="w-full" onClick={submitTicket}>
              Submit ticket
            </Button>
          </Panel>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="mv-hero-card mv-glow p-6">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center text-2xl font-bold text-white shadow-[var(--shadow-glow)]"
                  style={{ backgroundColor: avatarColor }}
                >
                  {(displayName || "MV").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{displayName || "Your profile"}</h1>
                  <p className="mt-1 text-sm text-[var(--muted)] capitalize">
                    {session.walletType} · {session.mode}
                  </p>
                </div>
              </div>
            </div>

            <Panel className="mv-glass space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-[var(--primary)]" /> Identity
              </h2>
              <div>
                <label className="mv-label">Username</label>
                <Input
                  value={getAccountUsername() ?? displayName}
                  readOnly
                  className="opacity-80"
                />
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  Set during wallet setup · used for tickets and account moderation
                </p>
              </div>
              <div>
                <label className="mv-label">Display name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Trader name" />
              </div>
              <div>
                <label className="mv-label">Avatar color</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`h-8 w-8 border-2 transition ${avatarColor === c ? "border-[var(--foreground)] scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              {error && <p className="mv-alert-error">{error}</p>}
              {saved && (
                <p className="mv-alert-success">
                  Profile saved{savedLocally ? " on this device" : ""}
                </p>
              )}
              <Button onClick={saveProfile}>Save profile</Button>
            </Panel>
          </div>

          <Panel className="mv-glass space-y-4 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4 text-[var(--primary)]" /> Support
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Open the Support tab to submit tickets and see admin replies.
            </p>
            <Button variant="secondary" className="w-full" onClick={() => setTab("support")}>
              View my tickets
            </Button>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}