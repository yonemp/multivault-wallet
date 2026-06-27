"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { loadSession, SessionData } from "@/lib/wallet/session";
import { getAddress } from "@/lib/wallet/session";
import { ArrowLeft, MessageSquare, Shield, User } from "lucide-react";

const AVATAR_COLORS = ["#2f6fed", "#9945FF", "#F7931A", "#059669", "#dc2626", "#F0B90B"];

export default function ProfilePage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketBody, setTicketBody] = useState("");
  const [saved, setSaved] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primaryAddress =
    session ? getAddress(session, "ethereum") ?? getAddress(session, "solana") : null;

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      window.location.href = "/";
      return;
    }
    setSession(s);

    const addr = getAddress(s, "ethereum") ?? getAddress(s, "solana");
    if (addr) {
      fetch(`/api/profile?address=${encodeURIComponent(addr)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.profile) {
            setDisplayName(d.profile.display_name ?? "");
            setAvatarColor(d.profile.avatar_color ?? AVATAR_COLORS[0]);
          }
        })
        .catch(() => {});
    }
  }, []);

  async function saveProfile() {
    if (!primaryAddress) return;
    setError(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primaryAddress,
        displayName,
        avatarColor,
      }),
    });
    if (!res.ok) {
      setError("Failed to save profile");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function submitTicket() {
    if (!ticketSubject.trim() || !ticketBody.trim()) {
      setError("Fill in subject and message");
      return;
    }
    setError(null);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: primaryAddress,
        chain: session?.addresses.ethereum ? "ethereum" : "solana",
        subject: ticketSubject,
        body: ticketBody,
      }),
    });
    if (!res.ok) {
      setError("Failed to submit ticket");
      return;
    }
    setTicketSubject("");
    setTicketBody("");
    setTicketSent(true);
  }

  if (!session) {
    return <main className="flex min-h-screen items-center justify-center">Loading…</main>;
  }

  return (
    <AppShell showNav={false} maxWidth="6xl">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--primary)]">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="mv-hero-card p-6">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center text-2xl font-bold text-white shadow-[var(--shadow-glow)]"
                style={{ backgroundColor: avatarColor }}
              >
                {(displayName || "MV").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                  {displayName || "Your profile"}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)] capitalize">
                  {session.walletType} · {session.mode}
                </p>
              </div>
            </div>
          </div>

          <Panel className="space-y-4 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-[var(--primary)]" /> Identity
            </h2>
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
            {saved && <p className="mv-alert-success">Profile saved</p>}
            <Button onClick={saveProfile}>Save profile</Button>
          </Panel>

          <Panel className="space-y-4 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-[var(--primary)]" /> Security
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Your seed phrase is encrypted locally and never stored on our servers.
              To change your password, export your seed and re-import with a new one.
            </p>
            <p className="text-xs text-[var(--muted)]">
              Primary address: <span className="font-mono">{primaryAddress ?? "—"}</span>
            </p>
          </Panel>
        </div>

        <Panel className="space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4 text-[var(--primary)]" /> Support ticket
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Report issues or request help. Admins respond from the admin dashboard.
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
          {ticketSent && <p className="mv-alert-success">Ticket submitted</p>}
          <Button variant="secondary" className="w-full" onClick={submitTicket}>
            Submit ticket
          </Button>
        </Panel>
      </div>
    </AppShell>
  );
}