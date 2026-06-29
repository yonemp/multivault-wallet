"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MarketingShell } from "@/components/marketing/MarketingShell";
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

  async function handleSubmit(username: string, profileVisibility: "public" | "private") {
    if (!address) return;
    await saveUsernameForWallet(address, username, "#526fff", profileVisibility);
    window.location.href = redirect;
  }

  return (
    <MarketingShell narrow backHref="/" backLabel="Home">
      <div className="mv-premium-page-head">
        <h1 className="mv-premium-page-title">One last step</h1>
        <p className="mv-premium-page-sub">
          Pick a username before you enter the terminal.
        </p>
      </div>
      {address && <UsernamePicker submitLabel="Enter terminal" onSubmit={handleSubmit} />}
    </MarketingShell>
  );
}