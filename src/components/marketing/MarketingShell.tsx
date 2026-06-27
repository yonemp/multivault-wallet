import { Logo } from "@/components/layout/Logo";
import { BRAND_NAME } from "@/lib/brand";
import Link from "next/link";
import type { ReactNode } from "react";

type MarketingShellProps = {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  headerRight?: ReactNode;
  narrow?: boolean;
  showFooter?: boolean;
};

export function MarketingShell({
  children,
  backHref,
  backLabel = "Home",
  headerRight,
  narrow = false,
  showFooter = false,
}: MarketingShellProps) {
  return (
    <div className="mv-premium">
      <div className="mv-premium-bg" aria-hidden />
      <div className="mv-premium-grid" aria-hidden />

      <header className="mv-premium-header">
        <div className="mv-premium-container mv-premium-header-inner">
          <Logo href="/" tagline="Infrastructure" />
          <div className="mv-premium-header-actions">
            {backHref ? (
              <Link href={backHref} className="mv-premium-ghost-link">
                {backLabel}
              </Link>
            ) : null}
            {headerRight ?? (
              <>
                <Link href="/sign-in" className="mv-premium-ghost-link">
                  Sign in
                </Link>
                <Link href="/create" className="mv-premium-btn mv-premium-btn--solid">
                  Create wallet
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={`mv-premium-main ${narrow ? "mv-premium-main--narrow" : ""}`}>
        {children}
      </main>

      {showFooter && (
        <footer className="mv-premium-footer">
          <div className="mv-premium-container mv-premium-footer-inner">
            <p>© {new Date().getFullYear()} {BRAND_NAME}</p>
            <div className="mv-premium-footer-links">
              <Link href="/sign-in">Sign in</Link>
              <Link href="/create">Create wallet</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}