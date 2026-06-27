import { ConnectExternal } from "@/components/ConnectExternal";
import { Logo } from "@/components/layout/Logo";
import { ArrowRight, Download, Wallet } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="mv-landing">
      <div className="mv-landing-bg" aria-hidden />

      <header className="mv-landing-header">
        <div className="mv-landing-container mv-landing-header-inner">
          <Logo href="/" tagline="Infrastructure" />
          <div className="mv-landing-header-actions">
            <Link href="/create" className="mv-landing-link">
              Create wallet
            </Link>
          </div>
        </div>
      </header>

      <main className="mv-landing-section">
        <div className="mv-landing-container" style={{ maxWidth: "40rem" }}>
          <div className="mv-landing-section-head mv-landing-section-head--center">
            <p className="mv-landing-eyebrow">
              <Wallet className="h-3.5 w-3.5" />
              Access platform
            </p>
            <h1 className="mv-landing-section-title">Sign in to MultiVault</h1>
            <p className="mv-landing-section-copy">
              Import an existing wallet or connect an external provider to launch the terminal.
            </p>
          </div>

          <div className="mv-landing-onboard-grid">
            <Link href="/import" className="mv-landing-onboard-card">
              <p className="mv-landing-onboard-step">
                <Download className="inline h-3.5 w-3.5" /> Import
              </p>
              <h3>Import wallet</h3>
              <p>
                Restore access with your recovery phrase and encrypted local vault credentials.
              </p>
              <span className="mv-landing-onboard-link">
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            <div className="mv-landing-onboard-card" style={{ cursor: "default" }}>
              <p className="mv-landing-onboard-step">
                <Wallet className="inline h-3.5 w-3.5" /> Connect
              </p>
              <h3>Connect external wallet</h3>
              <p>
                Use MetaMask, Phantom, or Trust Wallet — no seed phrase required.
              </p>
              <div className="mt-4">
                <ConnectExternal />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}