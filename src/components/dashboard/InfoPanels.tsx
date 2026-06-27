"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function BuyCryptoPanel() {
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Buy Crypto"
        description="On-ramp SOL directly — no external site required"
      />
      <div className="mv-panel space-y-4 p-5">
        <p className="text-sm text-[var(--muted)]">
          Purchase SOL via integrated on-ramp partners. Connect your wallet first, then complete KYC with the provider.
        </p>
        <div className="grid gap-2">
          {["Coinbase Pay", "MoonPay", "Transak"].map((p) => (
            <button
              key={p}
              type="button"
              className="border border-[var(--border)] px-4 py-3 text-left text-sm transition hover:border-[var(--primary)]"
            >
              {p}
              <span className="ml-2 text-xs text-[var(--muted)]">— coming soon</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MultiWalletPanel() {
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Multi-wallet" description="Manage multiple wallets from one account" />
      <div className="mv-panel space-y-3 p-5 text-sm">
        <p className="text-[var(--muted)]">
          MultiVault currently uses one active session wallet. External connect (MetaMask / Phantom) registers per-chain addresses.
        </p>
        <ul className="space-y-2 text-xs text-[var(--muted)]">
          <li>· Create or import additional wallets via home page</li>
          <li>· Switch sessions by logging out and reconnecting</li>
          <li>· Vision tab tracks any public address</li>
        </ul>
        <Link href="/">
          <Button variant="secondary" className="w-full">Manage wallets</Button>
        </Link>
      </div>
    </div>
  );
}

export function FeesPanel() {
  const fees = [
    { label: "Swap (Jupiter / LI.FI)", value: "0.3% + network" },
    { label: "Solana network", value: "~0.000005 SOL" },
    { label: "Ethereum network", value: "Variable gas" },
    { label: "Limit orders", value: "Free (staged locally)" },
    { label: "Platform fee", value: "0% during beta" },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Fees" description="Trading fees and Solana network costs" />
      <div className="mv-panel divide-y divide-[var(--border)]">
        {fees.map((f) => (
          <div key={f.label} className="flex justify-between px-4 py-3 text-sm">
            <span className="text-[var(--muted)]">{f.label}</span>
            <span className="font-mono">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaqsPanel() {
  const faqs = [
    {
      q: "Is MultiVault custodial?",
      a: "No. Your seed phrase is encrypted locally and never sent to our servers.",
    },
    {
      q: "How fast are market orders?",
      a: "Execution speed depends on network conditions. Swaps route through Jupiter (Solana) and LI.FI (EVM).",
    },
    {
      q: "What is Pulse?",
      a: "Pulse tracks new token activity across migration stages — New, Final Stretch, and Migrated.",
    },
    {
      q: "How do rewards work?",
      a: "Earn points per trade. Referrals unlock a 10× multiplier. Ranks increase reward rates.",
    },
    {
      q: "Can I snipe migrations?",
      a: "Use the Sniper tab in Trade to stage migration snipes. On-chain execution requires unlock.",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="FAQs" description="Common questions about the platform" />
      <div className="space-y-2">
        {faqs.map((f) => (
          <details key={f.q} className="mv-panel group">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold marker:content-none">
              {f.q}
            </summary>
            <p className="border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function SupportPanel() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <PageHeader title="Support" description="Get help via tickets or community" />
      <div className="mv-panel space-y-4 p-6">
        <p className="text-sm text-[var(--muted)]">
          Chat with support on open tickets from Profile → Support until resolved.
        </p>
        <Link href="/profile?tab=support">
          <Button className="w-full">My support tickets</Button>
        </Link>
        <a
          href="https://discord.gg"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-[var(--primary)]"
        >
          Join Discord →
        </a>
      </div>
    </div>
  );
}