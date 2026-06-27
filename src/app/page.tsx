import { ConnectExternal } from "@/components/ConnectExternal";
import { Logo } from "@/components/layout/Logo";
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
    description: "Ethereum, Polygon, BNB Chain, and Solana.",
  },
  {
    icon: Zap,
    title: "Instant access",
    description: "Send, receive, and swap from one dashboard.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <a
            href="/dashboard"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Dashboard
          </a>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.06),_transparent_40%)]" />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <section className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
              Multi-chain web wallet
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Your crypto,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                one vault
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-500">
              Create or import a wallet, or connect MetaMask, Phantom, or Trust
              Wallet. Private keys and seed phrases never leave your device.
            </p>
          </section>

          <section className="mt-16 grid gap-4 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-20">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-400">
              Get started
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <WalletCard
                href="/create"
                title="Create new wallet"
                description="Generate a secure 12-word seed phrase and encrypt it locally on your device."
                icon="✨"
                accent="blue"
              />
              <WalletCard
                href="/import"
                title="Import wallet"
                description="Restore an existing wallet using your 12 or 24-word recovery phrase."
                icon="🔑"
                accent="sky"
              />
            </div>
          </section>

          <section className="mt-16">
            <div className="mx-auto max-w-xl">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-blue-100/50">
                <h2 className="text-center text-xl font-bold text-slate-900">
                  Connect existing wallet
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500">
                  Use MetaMask, Phantom, or Trust Wallet
                </p>
                <div className="mt-6">
                  <ConnectExternal />
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-24 text-center text-sm text-slate-400">
            MultiVault stores only public addresses after signature verification.
            Seed phrases are never uploaded.
          </footer>
        </div>
      </main>
    </div>
  );
}