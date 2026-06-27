import { ConnectExternal } from "@/components/ConnectExternal";
import { WalletCard } from "@/components/WalletCard";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.25),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_35%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-violet-300">
              MultiVault
            </p>
            <h1 className="mt-2 text-4xl font-bold text-white md:text-5xl">
              Your multi-chain wallet in the browser
            </h1>
          </div>
        </header>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Create or import a wallet, or connect MetaMask, Phantom, or Trust
          Wallet. Private keys and seed phrases never leave your device.
        </p>

        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Wallet-only
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <WalletCard
              href="/create"
              title="Create new wallet"
              description="Generate a secure 12-word seed phrase and encrypt it locally."
              icon="✨"
              accent="violet"
            />
            <WalletCard
              href="/import"
              title="Import wallet"
              description="Restore an existing wallet using your recovery phrase."
              icon="🔑"
              accent="blue"
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Connect existing wallet
          </h2>
          <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <ConnectExternal />
          </div>
        </section>

        <footer className="mt-auto pt-16 text-sm text-zinc-500">
          MultiVault stores only public wallet addresses in a local SQLite
          database after you sign a verification message. Seed phrases and
          private keys are never uploaded.
        </footer>
      </div>
    </main>
  );
}