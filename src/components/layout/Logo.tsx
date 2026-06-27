import clsx from "clsx";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

type LogoProps = {
  href?: string;
  compact?: boolean;
  tagline?: string;
  premium?: boolean;
};

export function Logo({ href = "/", compact = false, tagline = BRAND_TAGLINE, premium = false }: LogoProps) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90 ${premium ? "mv-premium-logo" : ""}`}
    >
      <div className={`relative flex h-8 w-8 items-center justify-center ${premium ? "mv-premium-logo-mark" : ""}`}>
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
          <path
            d="M16 4 L28 26 L4 26 Z"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.5"
          />
          <circle cx="16" cy="14" r="3" fill="var(--primary)" opacity="0.9" />
          <line x1="16" y1="17" x2="16" y2="22" stroke="var(--primary)" strokeWidth="1.2" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className={`text-sm font-semibold tracking-wide ${premium ? "mv-premium-logo-text" : "text-[var(--foreground)]"}`}>
            {BRAND_NAME}
          </p>
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            {tagline}
          </p>
        </div>
      )}
    </a>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={clsx("h-6 w-6", className)} aria-hidden>
      <path d="M16 4 L28 26 L4 26 Z" fill="none" stroke="var(--primary)" strokeWidth="1.5" />
      <circle cx="16" cy="14" r="3" fill="var(--primary)" />
    </svg>
  );
}