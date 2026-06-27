import { ConnectExternal } from "@/components/ConnectExternal";
import { Logo } from "@/components/layout/Logo";
import { Panel } from "@/components/ui/Panel";
import { WalletCard } from "@/components/WalletCard";
import { Shield, Zap, Globe } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Self-custody",
    description: "Keys never leave your device. Encrypted locally.",
  },
  {
    icon: Globe,
    title: "Multi-chain",
    description: "BTC, LTC, ETH, SOL, TON, XMR & XRP in one terminal.",
  },
  {
    icon: Zap,
    title: "Pro trading UI",
    description: "Pulse discovery, charts, TP/SL — Axiom-style terminal.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen pb-[var(--status-h)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <a href="/dashboard" className="ax-nav-link border border-[var(--border)] px-4 py-2 !text-[var(--foreground)]">
            Launch terminal
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-block border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            Multi-chain trading terminal
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            Trade like{" "}
            <span className="text-[var(--primary)]">Axiom.</span>
            <br />
            Custody like a vault.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Pulse discovery, live charts, portfolio tracking, and on-chain swap —
            seven networks, one dark terminal. Your keys never leave your device.
          </p>
        </section>

        <section className="mt-14 grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-[var(--surface)] px-5 py-5">
              <Icon className="h-4 w-4 text-[var(--primary)]" />
              <h3 className="mt-3 text-sm font-semibold text-[var(--foreground)]">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">{description}</p>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Get started
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <WalletCard
              href="/create"
              title="Create new wallet"
              description="Step-by-step setup with seed backup, encryption, and multi-wallet vault support."
            />
            <WalletCard
              href="/import"
              title="Import wallet"
              description="Restore any wallet by phrase — add more trading wallets anytime from Portfolio."
            />
          </div>
        </section>

        <section className="mt-12">
          <Panel className="p-5">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Connect external wallet
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              MetaMask, Phantom, or Trust Wallet — no seed phrase required.
            </p>
            <div className="mt-4">
              <ConnectExternal />
            </div>
          </Panel>
        </section>
      </main>
    </div>
  );
}