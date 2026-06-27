import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const stats = ["7 networks", "Self-custody", "Live markets", "Local encryption"];

const pillars = [
  {
    title: "Trade",
    line: "Charts, execution, and instant controls across major chains.",
  },
  {
    title: "Pulse",
    line: "Live discovery with real-time market cap and volume updates.",
  },
  {
    title: "Vault",
    line: "Multi-wallet operations with encrypted keys on your device.",
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
            Portfolio, pulse, and execution in a single operator workspace. Keys never leave your device.
          </p>

          <div className="mv-premium-hero-actions">
            <Link href="/create" className="mv-premium-btn mv-premium-btn--solid">
              Create wallet
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/sign-in" className="mv-premium-btn mv-premium-btn--outline">
              Sign in
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

            <Link href="/sign-in" className="mv-premium-access-card">
              <div>
                <p className="mv-premium-access-kicker">Returning operator</p>
                <h3>Sign in</h3>
                <p>Import your phrase or connect MetaMask, Phantom, or Trust.</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}