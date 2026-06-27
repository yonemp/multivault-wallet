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
    description: "BTC, LTC, ETH, SOL, TON, XMR & XRP in one place.",
  },
  {
    icon: Zap,
    title: "Instant access",
    description: "Send, receive, and swap from one dashboard.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <a
            href="/dashboard"
            className="border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
          >
            Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-block border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            Multi-chain web wallet
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            One vault.{" "}
            <span className="text-[var(--primary)]">Seven networks.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Bitcoin, Litecoin, Ethereum, Solana, TON, Monero & XRP — unified
            interface. Keys never leave your device.
          </p>
        </section>

        <section className="mt-14 grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-[var(--surface)] px-5 py-5 backdrop-blur-md">
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
              description="Generate a secure 12-word seed phrase and encrypt it locally on your device."
            />
            <WalletCard
              href="/import"
              title="Import wallet"
              description="Restore an existing wallet using your 12 or 24-word recovery phrase."
            />
          </div>
        </section>

        <section className="mt-14">
          <Panel className="mx-auto max-w-xl p-6">
            <h2 className="text-center text-base font-semibold text-[var(--foreground)]">
              Connect existing wallet
            </h2>
            <p className="mt-1 text-center text-sm text-[var(--muted)]">
              MetaMask, Phantom, or Trust Wallet
            </p>
            <div className="mt-5">
              <ConnectExternal />
            </div>
          </Panel>
        </section>

        <footer className="mt-20 text-center text-xs text-[var(--muted)]">
          MultiVault stores only public addresses after signature verification.
        </footer>
      </main>
    </div>
  );
}