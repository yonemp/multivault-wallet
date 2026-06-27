import { ConnectExternal } from "@/components/ConnectExternal";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ArrowRight, KeyRound } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <MarketingShell
      narrow
      backHref="/"
      backLabel="Home"
      headerRight={
        <Link href="/create" className="mv-premium-btn mv-premium-btn--solid">
          Create wallet
        </Link>
      }
    >
      <div className="mv-premium-page-head">
        <h1 className="mv-premium-page-title">Import wallet</h1>
        <p className="mv-premium-page-sub">Restore with your phrase or connect an external wallet.</p>
      </div>

      <div className="mv-premium-signin-grid">
        <Link href="/import" className="mv-premium-signin-card">
          <div className="mv-premium-signin-icon">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="mv-premium-signin-copy">
            <h2>Import wallet</h2>
            <p>Restore with your recovery phrase.</p>
          </div>
          <ArrowRight className="mv-premium-signin-arrow h-5 w-5" />
        </Link>

        <div className="mv-premium-signin-card mv-premium-signin-card--static">
          <div className="mv-premium-signin-copy">
            <h2>Connect wallet</h2>
            <p>MetaMask, Phantom, or Trust Wallet.</p>
          </div>
          <div className="mv-premium-connect">
            <ConnectExternal />
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}