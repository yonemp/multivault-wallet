"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/landing/LandingMotion";
import { Activity, Layers3, Shield, TrendingUp, Wallet, Bot, Coins } from "lucide-react";

const pillars = [
  {
    title: "Trade",
    line: "Charts, execution, instant controls across major chains.",
    icon: TrendingUp,
    hue: "blue",
  },
  {
    title: "Pulse",
    line: "Live memecoin discovery with real-time market cap and volume.",
    icon: Activity,
    hue: "amber",
  },
  {
    title: "Vault",
    line: "Multi-wallet operations with encrypted keys on your device.",
    icon: Shield,
    hue: "violet",
  },
];

const stackLayers = [
  {
    icon: Coins,
    title: "Memecoins",
    tag: "Culture layer",
    line: "Attention markets on-chain. Narrative velocity at protocol speed.",
    hue: "amber",
  },
  {
    icon: Layers3,
    title: "DeFi",
    tag: "Protocol layer",
    line: "Composable swaps, lending, and yield as open financial software.",
    hue: "cyan",
  },
  {
    icon: Bot,
    title: "AI × Finance",
    tag: "Compute layer",
    line: "Agents with wallets. Machine-native capital and live intel.",
    hue: "violet",
  },
];

export function LandingPillars() {
  return (
    <>
      <section className="mv-premium-pillars mv-premium-pillars--bento">
        <div className="mv-premium-container">
          <Reveal>
            <p className="mv-premium-section-kicker">Core systems</p>
            <h2 className="mv-premium-section-title">Built for operators, not tourists</h2>
          </Reveal>
          <Stagger className="mv-premium-bento-grid mt-10">
            {pillars.map((p) => (
              <StaggerItem key={p.title}>
                <article className={`mv-premium-bento-card mv-premium-bento-card--${p.hue}`}>
                  <div className="mv-premium-bento-icon">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.line}</p>
                  <div className="mv-premium-bento-shine" />
                </article>
              </StaggerItem>
            ))}
            <StaggerItem>
              <article className="mv-premium-bento-card mv-premium-bento-card--wide mv-premium-bento-card--cyan">
                <Wallet className="h-5 w-5 text-[var(--p-cyan)]" />
                <h3>One terminal. Every chain.</h3>
                <p>Solana memecoins today. Multi-chain DeFi tomorrow. Same vault, same keys, same workspace.</p>
              </article>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      <section className="mv-premium-pillars mv-premium-pillars--stack">
        <div className="mv-premium-container">
          <Reveal>
            <p className="mv-premium-section-kicker">The future of finance</p>
            <h2 className="mv-premium-section-title">
              Crypto, memecoins, DeFi, and AI — one operator stack
            </h2>
            <p className="mv-premium-section-lead">
              Culture, protocol, and compute — three layers converging into programmable global
              finance. Scroll for the full thesis.
            </p>
          </Reveal>
          <Stagger className="mv-premium-stack-grid mt-10">
            {stackLayers.map((layer) => (
              <StaggerItem key={layer.title}>
                <article className={`mv-premium-stack-card mv-premium-stack-card--${layer.hue}`}>
                  <layer.icon className="mv-premium-stack-icon" />
                  <p className="mv-premium-stack-tag">{layer.tag}</p>
                  <h3>{layer.title}</h3>
                  <p>{layer.line}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  );
}