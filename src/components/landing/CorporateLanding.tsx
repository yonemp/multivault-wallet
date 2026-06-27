import { ConnectExternal } from "@/components/ConnectExternal";
import { Logo } from "@/components/layout/Logo";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Globe2,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

const metrics = [
  { value: "7", label: "Supported networks" },
  { value: "100%", label: "Self-custody architecture" },
  { value: "24/7", label: "Live market coverage" },
  { value: "AES-256", label: "Local encryption standard" },
];

const capabilities = [
  {
    icon: Globe2,
    title: "Unified multi-chain operations",
    description:
      "Manage Bitcoin, Ethereum, Solana, and additional networks from a single institutional workspace with consolidated reporting.",
  },
  {
    icon: BarChart3,
    title: "Real-time market intelligence",
    description:
      "Pulse discovery, live pricing, and professional charting give teams actionable visibility across digital asset markets.",
  },
  {
    icon: ShieldCheck,
    title: "Security-first by design",
    description:
      "Private keys remain on the client device. Credentials are encrypted locally with industry-standard algorithms.",
  },
  {
    icon: Users,
    title: "Built for teams and operators",
    description:
      "Portfolio oversight, wallet management, and trading workflows designed for disciplined execution at scale.",
  },
];

const principles = [
  "No custodial key storage",
  "Encrypted wallet vault on device",
  "Verified SMS and email controls",
  "Role-ready admin oversight",
];

export function CorporateLanding() {
  return (
    <div className="mv-landing">
      <div className="mv-landing-bg" aria-hidden />

      <header className="mv-landing-header">
        <div className="mv-landing-container mv-landing-header-inner">
          <Logo tagline="Infrastructure" />
          <nav className="mv-landing-nav" aria-label="Primary">
            <a href="#platform">Platform</a>
            <a href="#security">Security</a>
            <a href="#onboarding">Get started</a>
          </nav>
          <div className="mv-landing-header-actions">
            <Link href="/dashboard" className="mv-landing-link">
              Sign in
            </Link>
            <Link href="/create" className="mv-landing-btn mv-landing-btn--primary">
              Open platform
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mv-landing-hero">
          <div className="mv-landing-container mv-landing-hero-grid">
            <div className="mv-landing-hero-copy">
              <p className="mv-landing-eyebrow">
                <Building2 className="h-3.5 w-3.5" />
                Institutional digital asset infrastructure
              </p>
              <h1 className="mv-landing-title">
                Secure multi-chain trading and custody for enterprise operators.
              </h1>
              <p className="mv-landing-lead">
                MultiVault unifies portfolio management, live market intelligence, and
                self-custody wallet infrastructure across seven blockchain networks — with
                the controls and clarity expected of a global financial platform.
              </p>
              <div className="mv-landing-hero-cta">
                <Link href="/create" className="mv-landing-btn mv-landing-btn--primary">
                  Create organization wallet
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="mv-landing-btn mv-landing-btn--secondary">
                  Launch terminal
                </Link>
              </div>
            </div>

            <div className="mv-landing-hero-panel">
              <div className="mv-landing-panel-head">
                <span>Executive overview</span>
                <span className="mv-landing-panel-live">Live</span>
              </div>
              <div className="mv-landing-panel-metrics">
                {metrics.map((m) => (
                  <div key={m.label} className="mv-landing-panel-stat">
                    <p className="mv-landing-panel-stat-value">{m.value}</p>
                    <p className="mv-landing-panel-stat-label">{m.label}</p>
                  </div>
                ))}
              </div>
              <p className="mv-landing-panel-foot">
                Trusted execution environment for teams that require direct asset control,
                auditable workflows, and real-time market visibility.
              </p>
            </div>
          </div>
        </section>

        <section className="mv-landing-metrics">
          <div className="mv-landing-container mv-landing-metrics-grid">
            {metrics.map((m) => (
              <div key={m.label} className="mv-landing-metric">
                <p className="mv-landing-metric-value">{m.value}</p>
                <p className="mv-landing-metric-label">{m.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="platform" className="mv-landing-section">
          <div className="mv-landing-container">
            <div className="mv-landing-section-head">
              <p className="mv-landing-eyebrow">Platform capabilities</p>
              <h2 className="mv-landing-section-title">
                One operating system for digital asset teams.
              </h2>
              <p className="mv-landing-section-copy">
                From discovery to execution, MultiVault delivers a disciplined interface for
                operators who need speed without compromising governance.
              </p>
            </div>

            <div className="mv-landing-cap-grid">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <article key={title} className="mv-landing-cap-card">
                  <div className="mv-landing-cap-icon">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="mv-landing-section mv-landing-section--alt">
          <div className="mv-landing-container mv-landing-security-grid">
            <div>
              <p className="mv-landing-eyebrow">
                <Lock className="h-3.5 w-3.5" />
                Security & governance
              </p>
              <h2 className="mv-landing-section-title">
                Built to meet the standards serious organizations demand.
              </h2>
              <p className="mv-landing-section-copy">
                MultiVault is architected around non-custodial control, encrypted local
                storage, and verification-backed account changes — reducing operational risk
                while preserving execution speed.
              </p>
              <ul className="mv-landing-principles">
                {principles.map((item) => (
                  <li key={item}>
                    <ShieldCheck className="h-4 w-4" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mv-landing-security-card">
              <h3>Operational confidence</h3>
              <p>
                Your organization retains direct control of private keys and signing authority.
                Administrative tooling, support workflows, and account protections are integrated
                into the platform experience.
              </p>
              <div className="mv-landing-security-badges">
                <span>Client-side keys</span>
                <span>2FA verification</span>
                <span>Admin oversight</span>
              </div>
            </div>
          </div>
        </section>

        <section id="onboarding" className="mv-landing-section">
          <div className="mv-landing-container">
            <div className="mv-landing-section-head mv-landing-section-head--center">
              <p className="mv-landing-eyebrow">Deployment</p>
              <h2 className="mv-landing-section-title">Activate your workspace in minutes.</h2>
            </div>

            <div className="mv-landing-onboard-grid">
              <Link href="/create" className="mv-landing-onboard-card">
                <p className="mv-landing-onboard-step">01</p>
                <h3>Create new wallet</h3>
                <p>
                  Guided setup with seed backup, encryption, and multi-wallet vault support for
                  operating teams.
                </p>
                <span className="mv-landing-onboard-link">
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>

              <Link href="/import" className="mv-landing-onboard-card">
                <p className="mv-landing-onboard-step">02</p>
                <h3>Import existing wallet</h3>
                <p>
                  Restore from recovery phrase and extend your vault with additional trading
                  wallets at any time.
                </p>
                <span className="mv-landing-onboard-link">
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>

            <div className="mv-landing-connect">
              <div className="mv-landing-connect-copy">
                <h3>Connect external wallet</h3>
                <p>
                  Link MetaMask, Phantom, or Trust Wallet for immediate platform access without
                  importing a seed phrase.
                </p>
              </div>
              <div className="mv-landing-connect-actions">
                <ConnectExternal />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mv-landing-footer">
        <div className="mv-landing-container mv-landing-footer-inner">
          <div>
            <Logo tagline="Infrastructure" />
            <p className="mv-landing-footer-tagline">
              Enterprise-grade multi-chain infrastructure for modern digital asset operators.
            </p>
          </div>
          <div className="mv-landing-footer-links">
            <a href="#platform">Platform</a>
            <a href="#security">Security</a>
            <a href="#onboarding">Get started</a>
            <Link href="/dashboard">Terminal</Link>
          </div>
          <p className="mv-landing-footer-legal">
            © {new Date().getFullYear()} MultiVault Technologies. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}