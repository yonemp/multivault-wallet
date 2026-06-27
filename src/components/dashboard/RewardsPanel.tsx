"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  applyReferral,
  loadRewards,
  RewardsState,
} from "@/lib/platform/rewards";
import { Copy, Gift, Trophy } from "lucide-react";
import { safeFixed } from "@/lib/format/numbers";

const RANKS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 500 },
  { name: "Gold", min: 2000 },
  { name: "Platinum", min: 5000 },
  { name: "Diamond", min: 10000 },
];

export function RewardsPanel() {
  const [state, setState] = useState<RewardsState | null>(null);
  const [referralInput, setReferralInput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setState(loadRewards());
  }, []);

  function handleReferral() {
    if (!referralInput.trim()) return;
    setState(applyReferral(referralInput.trim().toUpperCase()));
    setReferralInput("");
  }

  async function copyCode() {
    if (!state) return;
    await navigator.clipboard.writeText(state.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!state) return null;

  const nextRank = RANKS.find((r) => r.min > state.points);

  return (
    <div>
      <PageHeader
        title="Rewards"
        description="Earn SOL and points for trading — progress through ranks for higher multipliers"
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="mv-panel p-4">
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <Trophy className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Rank</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{state.rank}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {state.multiplier}× point multiplier
          </p>
        </div>
        <div className="mv-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Points</p>
          <p className="mt-2 font-mono text-2xl font-bold">{state.points.toLocaleString()}</p>
          {nextRank && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              {(nextRank.min - state.points).toLocaleString()} to {nextRank.name}
            </p>
          )}
        </div>
        <div className="mv-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">SOL earned</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[var(--gain)]">
            {safeFixed(state.solEarned, 4, "0.0000")}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">{state.tradesCount} trades</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="mv-panel space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold">Referral program</h3>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Share your code — referrals start at 10× multiplier. You earn points when they trade.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm">
              {state.referralCode}
            </code>
            <Button variant="secondary" size="sm" onClick={copyCode}>
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied" : ""}
            </Button>
          </div>
          {!state.referredBy ? (
            <div className="flex gap-2">
              <Input
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
                placeholder="Enter referral code"
              />
              <Button onClick={handleReferral}>Apply</Button>
            </div>
          ) : (
            <p className="text-xs text-[var(--gain)]">
              Referred by {state.referredBy} · 10× active
            </p>
          )}
        </div>

        <div className="mv-panel p-4">
          <h3 className="text-sm font-semibold">Quests</h3>
          <ul className="mt-3 space-y-2 text-xs">
            {[
              { q: "Complete first swap", pts: 100, done: state.tradesCount > 0 },
              { q: "Track a wallet in Vision", pts: 50, done: false },
              { q: "Set a limit order", pts: 75, done: false },
              { q: "Refer a friend", pts: 500, done: !!state.referredBy },
            ].map((item) => (
              <li key={item.q} className="flex justify-between border-b border-[var(--border)] py-2">
                <span className={item.done ? "text-[var(--muted)] line-through" : ""}>{item.q}</span>
                <span className="font-mono text-[var(--primary)]">+{item.pts}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}