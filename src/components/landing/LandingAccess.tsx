"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/landing/LandingMotion";
import { ArrowRight, KeyRound, Sparkles } from "lucide-react";
import Link from "next/link";

export function LandingAccess() {
  return (
    <section className="mv-premium-access">
      <div className="mv-premium-container">
        <Reveal>
          <p className="mv-premium-section-kicker">Get started</p>
          <h2 className="mv-premium-section-title">Enter the terminal</h2>
        </Reveal>
        <Stagger className="mv-premium-access-grid mt-8">
          <StaggerItem>
            <Link href="/create" className="mv-premium-access-card mv-premium-access-card--primary">
              <div className="mv-premium-access-icon mv-premium-access-icon--glow">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="mv-premium-access-kicker">New workspace</p>
                <h3>Create wallet</h3>
                <p>Generate a vault, back up your phrase, and go live.</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 opacity-60" />
            </Link>
          </StaggerItem>
          <StaggerItem>
            <Link href="/import" className="mv-premium-access-card">
              <div className="mv-premium-access-icon">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="mv-premium-access-kicker">Existing wallet</p>
                <h3>Import wallet</h3>
                <p>Restore with your recovery phrase and open the terminal.</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 opacity-60" />
            </Link>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}