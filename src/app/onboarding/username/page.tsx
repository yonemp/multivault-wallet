"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { UsernamePicker } from "@/components/onboarding/UsernamePicker";
import { saveUsernameForWallet } from "@/lib/platform/account-username";
import { loadSession, getAddress } from "@/lib/wallet/session";

export default function OnboardingUsernamePage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      window.location.href = "/";
      return;
    }
    const addr = getAddress(session, "ethereum") ?? getAddress(session, "solana");
    if (!addr) {
      window.location.href = "/";
      return;
    }
    setAddress(addr);
  }, []);

  async function handleSubmit(username: string) {
    if (!address) return;
    await saveUsernameForWallet(address, username);
    window.location.href = redirect;
  }

  return (
    <div className="relative min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo href="/" compact />
          <Link href="/" className="text-xs text-[var(--muted)] hover:text-[var(--primary)]">
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <UsernamePicker onSubmit={handleSubmit} />
      </main>
    </div>
  );
}