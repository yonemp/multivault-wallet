import { MarketingShell } from "@/components/marketing/MarketingShell";
import { LandingLongform } from "@/components/landing/LandingLongform";
import { BRAND_NAME } from "@/lib/brand";
import { ArrowRight, Bot, Coins, Layers } from "lucide-react";
import Link from "next/link";

const stats = ["7 networks", "Self-custody", "Live markets", "AI Intel"];

const pillars = [
  {
    title: "Trade",
    line: "Charts, execution, and instant controls across major chains.",
  },
  {
    title: "Pulse",
    line: "Live memecoin discovery with real-time market cap and volume.",
  },
  {
    title: "Vault",
    line: "Multi-wallet operations with encrypted keys on your device.",
  },
];

const stackLayers = [
  {
    icon: Coins,
    title: "Memecoins",
    tag: "Culture layer",
    line: "Attention markets on-chain. Narrative velocity, community energy, and liquidity cycles at protocol speed.",
  },
  {
    icon: Layers,
    title: "DeFi",
    tag: "Protocol layer",
    line: "Swaps, lending, and yield as composable software — open financial primitives anyone can build on.",
  },
  {
    icon: Bot,
    title: "AI × Finance",
    tag: "Compute layer",
    line: "Agents with wallets. On-chain data synthesis. The rise of programmable, machine-native capital.",
  },
];

export function CorporateLanding() {
  return (
    <MarketingShell showFooter>
      <section className="mv-premium-hero">
        <div className="mv-premium-container">
          <h1 className="mv-premium-display">
            Control every chain.
            <br />
            <span className="mv-premium-display-accent">One vault.</span>
          </h1>
          <p className="mv-premium-lead">
            {BRAND_NAME} is the multi-chain trading terminal for memecoins, DeFi, and the AI-driven
            future of finance — portfolio, pulse, execution, and intelligence in one operator workspace.
          </p>

          <div className="mv-premium-hero-actions">
            <Link href="/create" className="mv-premium-btn mv-premium-btn--solid">
              Create wallet
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/import" className="mv-premium-btn mv-premium-btn--outline">
              Import wallet
            </Link>
          </div>

          <ul className="mv-premium-stat-row">
            {stats.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mv-premium-pillars">
        <div className="mv-premium-container mv-premium-pillar-grid">
          {pillars.map((p) => (
            <article key={p.title} className="mv-premium-pillar">
              <h2>{p.title}</h2>
              <p>{p.line}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mv-premium-pillars mv-premium-pillars--stack">
        <div className="mv-premium-container">
          <p className="mv-premium-section-kicker">The future of finance</p>
          <h2 className="mv-premium-section-title">
            Crypto, memecoins, DeFi, and AI — one operator stack
          </h2>
          <p className="mv-premium-section-lead">
            {BRAND_NAME} Intel brings live market data, thesis on programmable money, and an AI copilot
            for navigating memecoins, DeFi composability, and agentic finance. Read on — this page goes
            deep on the platform, the market, and the potential.
          </p>
          <div className="mv-premium-pillar-grid mt-8">
            {stackLayers.map((layer) => (
              <article key={layer.title} className="mv-premium-pillar">
                <layer.icon className="mb-3 h-5 w-5 text-[var(--primary)]" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {layer.tag}
                </p>
                <h3 className="mt-1 text-base font-semibold">{layer.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{layer.line}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LandingLongform />

      <section className="mv-premium-access">
        <div className="mv-premium-container">
          <div className="mv-premium-access-grid">
            <Link href="/create" className="mv-premium-access-card mv-premium-access-card--primary">
              <div>
                <p className="mv-premium-access-kicker">New workspace</p>
                <h3>Create wallet</h3>
                <p>Generate a vault, back up your phrase, and go live.</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0" />
            </Link>

            <Link href="/import" className="mv-premium-access-card">
              <div>
                <p className="mv-premium-access-kicker">Existing wallet</p>
                <h3>Import wallet</h3>
                <p>Restore with your recovery phrase and open the terminal.</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}