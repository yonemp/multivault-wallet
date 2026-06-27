import { BRAND_NAME } from "@/lib/brand";
import {
  AI_CHAPTER,
  DEFI_CHAPTER,
  FINAL_CTA,
  LANDING_HERO_EXTENDED,
  MEMECOIN_CHAPTER,
  PLATFORM_FEATURES,
  POTENTIAL_CHAPTER,
  PULL_QUOTES,
  ROADMAP_ITEMS,
  WEBSITE_CHAPTER,
  type LandingChapter,
} from "@/lib/marketing/landing-content";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

function ChapterSection({ chapter, alt }: { chapter: LandingChapter; alt?: boolean }) {
  return (
    <section
      id={chapter.id}
      className={`mv-premium-chapter ${alt ? "mv-premium-chapter--alt" : ""}`}
    >
      <div className="mv-premium-container mv-premium-chapter-inner">
        <p className="mv-premium-section-kicker">{chapter.kicker}</p>
        <h2 className="mv-premium-chapter-title">{chapter.title}</h2>
        <p className="mv-premium-chapter-lead">{chapter.lead}</p>
        <div className="mv-premium-prose">
          {chapter.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
        {chapter.bullets && (
          <ul className="mv-premium-bullet-list">
            {chapter.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function LandingLongform() {
  return (
    <>
      <section className="mv-premium-intro">
        <div className="mv-premium-container">
          <p className="mv-premium-intro-text">{LANDING_HERO_EXTENDED.sublead}</p>
          <p className="mv-premium-intro-text mv-premium-intro-text--dim">
            {LANDING_HERO_EXTENDED.secondLead}
          </p>
        </div>
      </section>

      <ChapterSection chapter={WEBSITE_CHAPTER} />

      <section className="mv-premium-features">
        <div className="mv-premium-container">
          <p className="mv-premium-section-kicker">Inside the terminal</p>
          <h2 className="mv-premium-section-title">Every module, one workspace</h2>
          <p className="mv-premium-section-lead">
            {BRAND_NAME} isn&apos;t a single feature — it&apos;s six interconnected systems built for
            how on-chain operators actually work.
          </p>
        </div>
        <div className="mv-premium-feature-list">
          {PLATFORM_FEATURES.map((f, i) => (
            <article
              key={f.title}
              className={`mv-premium-feature-block ${i % 2 === 1 ? "mv-premium-feature-block--flip" : ""}`}
            >
              <div className="mv-premium-container mv-premium-feature-grid">
                <div className="mv-premium-feature-head">
                  <p className="mv-premium-section-kicker">{f.tag}</p>
                  <h3 className="mv-premium-feature-title">{f.title}</h3>
                </div>
                <div className="mv-premium-prose">
                  {f.paragraphs.map((p) => (
                    <p key={p.slice(0, 48)}>{p}</p>
                  ))}
                  {f.bullets && (
                    <ul className="mv-premium-bullet-list">
                      {f.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {PULL_QUOTES.map((q, i) => (
        <blockquote key={q.quote.slice(0, 30)} className="mv-premium-pullquote">
          <div className="mv-premium-container">
            <p className="mv-premium-pullquote-text">&ldquo;{q.quote}&rdquo;</p>
            <cite className="mv-premium-pullquote-cite">— {q.attr}</cite>
          </div>
        </blockquote>
      ))}

      <ChapterSection chapter={MEMECOIN_CHAPTER} alt />
      <ChapterSection chapter={DEFI_CHAPTER} />
      <ChapterSection chapter={AI_CHAPTER} alt />

      <section className="mv-premium-roadmap">
        <div className="mv-premium-container">
          <p className="mv-premium-section-kicker">Roadmap</p>
          <h2 className="mv-premium-section-title">Built, building, imagined</h2>
          <p className="mv-premium-section-lead">
            Transparency about what ships today and what the architecture is preparing for.
          </p>
          <div className="mv-premium-roadmap-grid">
            {ROADMAP_ITEMS.map((phase) => (
              <div key={phase.phase} className="mv-premium-roadmap-card">
                <h3 className="mv-premium-roadmap-phase">{phase.phase}</h3>
                <ul>
                  {phase.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ChapterSection chapter={POTENTIAL_CHAPTER} alt />

      <section className="mv-premium-manifesto">
        <div className="mv-premium-container mv-premium-manifesto-inner">
          <h2 className="mv-premium-manifesto-title">
            The next financial era won&apos;t be won by the biggest bank.
          </h2>
          <p className="mv-premium-manifesto-body">
            It will be navigated by operators with the best tools — self-custody wallets, live discovery
            feeds, composable DeFi execution, AI-assisted context, and the discipline to survive
            reflexive markets. {BRAND_NAME} is being built for those operators. For the culture traders
            and the protocol natives. For anyone who believes money should be programmable and finance
            should be global.
          </p>
          <p className="mv-premium-manifesto-body">
            This website is the beginning. The terminal is the proof. The potential is the rest.
          </p>
        </div>
      </section>

      <section className="mv-premium-final-cta">
        <div className="mv-premium-container mv-premium-final-cta-inner">
          <h2 className="mv-premium-final-cta-title">{FINAL_CTA.title}</h2>
          <p className="mv-premium-final-cta-lead">{FINAL_CTA.lead}</p>
          <div className="mv-premium-hero-actions">
            <Link href="/create" className="mv-premium-btn mv-premium-btn--solid">
              Create wallet
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/import" className="mv-premium-btn mv-premium-btn--outline">
              Import wallet
            </Link>
          </div>
          <p className="mv-premium-final-note">
            Already set up?{" "}
            <Link href="/dashboard?tab=intel" className="text-[var(--p-accent)] hover:underline">
              Open Intel in the terminal
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}