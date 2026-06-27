"use client";

import { BRAND_NAME } from "@/lib/brand";
import { Reveal } from "@/components/landing/LandingMotion";
import { ArrowRight, Radio, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const stats = [
  { label: "7 networks", icon: Zap },
  { label: "Self-custody", icon: Sparkles },
  { label: "Live Pulse", icon: Radio },
  { label: "AI Intel", icon: Sparkles },
];

const TICKERS = ["$BONK", "$WIF", "$POPCAT", "SOL +2.4%", "PULSE LIVE", "JUPITER", "MEMECOIN", "DEFI", "AGENTS"];

export function LandingHero() {
  const reduce = useReducedMotion();

  return (
    <section className="mv-premium-hero">
      <div className="mv-premium-container mv-premium-hero-grid">
        <div className="mv-premium-hero-copy">
          <Reveal>
            <div className="mv-premium-hero-badge">
              <span className="mv-premium-live-dot" />
              Multi-chain terminal · tackers.xyz
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="mv-premium-display">
              <span className="mv-premium-display-line">Control every chain.</span>
              <span className="mv-premium-display-gradient">One vault.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mv-premium-lead">
              {BRAND_NAME} is the operator workspace for memecoins, DeFi, and the AI-driven future of
              finance — pulse discovery, live execution, encrypted vault, and intelligence in one
              cinematic terminal.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mv-premium-hero-actions">
              <Link href="/create" className="mv-premium-btn mv-premium-btn--glow">
                Create wallet
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/import" className="mv-premium-btn mv-premium-btn--glass">
                Import wallet
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mv-premium-stat-pills">
              {stats.map(({ label, icon: Icon }) => (
                <span key={label} className="mv-premium-stat-pill">
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="mv-premium-hero-visual">
          <motion.div
            className="mv-premium-terminal-mock"
            animate={reduce ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="mv-premium-terminal-chrome">
              <span className="mv-premium-terminal-dot mv-premium-terminal-dot--r" />
              <span className="mv-premium-terminal-dot mv-premium-terminal-dot--y" />
              <span className="mv-premium-terminal-dot mv-premium-terminal-dot--g" />
              <span className="mv-premium-terminal-title">{BRAND_NAME} / pulse</span>
              <span className="mv-premium-terminal-live">LIVE</span>
            </div>
            <div className="mv-premium-terminal-body">
              <div className="mv-premium-mock-cols">
                {["New", "Final", "Migrated"].map((col, i) => (
                  <div key={col} className="mv-premium-mock-col">
                    <p className="mv-premium-mock-col-label">{col}</p>
                    {[0, 1, 2].map((j) => (
                      <div
                        key={j}
                        className="mv-premium-mock-card"
                        style={{ animationDelay: `${(i * 3 + j) * 0.15}s` }}
                      >
                        <div className="mv-premium-mock-card-top">
                          <span className="mv-premium-mock-ticker">
                            ${["PEPE", "MOON", "CAT"][j]}
                          </span>
                          <span className="mv-premium-mock-mcap">
                            ${(12 + i * 8 + j * 3).toFixed(0)}k
                          </span>
                        </div>
                        <div className="mv-premium-mock-bar">
                          <span style={{ width: `${40 + j * 18 + i * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mv-premium-terminal-glow" />
          </motion.div>
        </Reveal>
      </div>

      <div className="mv-premium-marquee-wrap">
        <div className="mv-premium-marquee">
          {[...TICKERS, ...TICKERS].map((t, i) => (
            <span key={`${t}-${i}`} className="mv-premium-marquee-item">
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}