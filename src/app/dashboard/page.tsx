"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardTab } from "@/components/dashboard/ActionTabs";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";
import { PulsePanel } from "@/components/dashboard/PulsePanel";

import { SimilarTokensPanel } from "@/components/dashboard/SimilarTokensPanel";
import { ReceivePanel } from "@/components/dashboard/ReceivePanel";
import { SendPanel } from "@/components/dashboard/SendPanel";
import { SwapPanel } from "@/components/dashboard/SwapPanel";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { TrackersPanel } from "@/components/dashboard/TrackersPanel";

import { RewardsPanel } from "@/components/dashboard/RewardsPanel";
import { TweetMonitorPanel } from "@/components/dashboard/TweetMonitorPanel";
import { TraderScanPanel } from "@/components/dashboard/TraderScanPanel";
import { InstantTradePanel } from "@/components/dashboard/InstantTradePanel";
import {
  BuyCryptoPanel,
  FeesPanel,
  FaqsPanel,
  SupportPanel,
} from "@/components/dashboard/InfoPanels";
import { AppShell } from "@/components/layout/AppShell";
import { UnlockGate } from "@/components/wallet/UnlockGate";
import { TERMINAL_TABS } from "@/lib/navigation/axiom-nav";
import { useWalletLock } from "@/hooks/useWalletLock";
import {
  ChainBalances,
  fetchChainBalances,
} from "@/lib/wallet/balances-client";
import {
  clearSession,
  loadSession,
  SessionData,
  getAddress,
} from "@/lib/wallet/session";
import { clearUnlockedMnemonic } from "@/lib/wallet/unlock-store";
import { migrateLegacyWallet } from "@/lib/wallet/wallet-vault";
import { hasAccountUsername, getAccountUsername } from "@/lib/platform/account-username";
import { FrozenAccountGate } from "@/components/wallet/FrozenAccountGate";

function tabFromParam(value: string | null): DashboardTab | null {
  if (!value) return null;
  const valid: DashboardTab[] = [
    "pulse", "trackers", "overview", "rewards", "trade", "similar",
    "tweets", "scan", "instant", "swap", "buy", "fees", "faqs",
    "support", "send", "receive",
  ];
  return valid.includes(value as DashboardTab) ? (value as DashboardTab) : null;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const initialized = useRef(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [balances, setBalances] = useState<ChainBalances>({});
  const [activeTab, setActiveTab] = useState<DashboardTab>("pulse");
  const [tradeAsset, setTradeAsset] = useState("sol");
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [openWalletsTab, setOpenWalletsTab] = useState(false);
  const [showWalletWelcome, setShowWalletWelcome] = useState(false);
  const [accountFrozen, setAccountFrozen] = useState<{
    reason: string | null;
  } | null>(null);
  const [gateReady, setGateReady] = useState(false);

  const lock = useWalletLock(session);

  const loadBalances = useCallback(async (current: SessionData) => {
    setLoadingBalances(true);
    try {
      setBalances(await fetchChainBalances(current.addresses));
    } finally {
      setLoadingBalances(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const current = loadSession();
    if (!current) {
      window.location.href = "/";
      return;
    }

    migrateLegacyWallet(current);

    if (!hasAccountUsername()) {
      window.location.href = "/onboarding/username?redirect=/dashboard";
      return;
    }

    const primary =
      getAddress(current, "ethereum") ?? getAddress(current, "solana");
    if (primary) {
      fetch(`/api/wallet/status?address=${encodeURIComponent(primary)}`)
        .then(async (r) => {
          if (!r.ok) return null;
          return r.json() as Promise<{ isFrozen?: boolean; frozenReason?: string | null }>;
        })
        .then((data) => {
          if (data?.isFrozen) {
            setAccountFrozen({ reason: data.frozenReason ?? null });
          }
        })
        .catch(() => {})
        .finally(() => setGateReady(true));
    } else {
      setGateReady(true);
    }

    setSession(current);

    const tab = tabFromParam(searchParams.get("tab"));
    if (tab) setActiveTab(tab);
    if (searchParams.get("wallets") === "1") setOpenWalletsTab(true);
    if (searchParams.get("welcome") === "1") setShowWalletWelcome(true);

    if (Object.keys(current.addresses).length > 0) {
      loadBalances(current);
    }
  }, [searchParams, loadBalances]);

  function handleLogout() {
    lock.lock();
    clearUnlockedMnemonic();
    clearSession();
    window.location.href = "/";
  }

  function handleNavigate(tab: DashboardTab, asset?: string) {
    if (asset) setTradeAsset(asset);
    setActiveTab(tab);
  }

  function handleSessionChange(next: SessionData) {
    setSession(next);
    loadBalances(next);
  }

  const isTerminal = TERMINAL_TABS.includes(activeTab);
  const showLockBanner = session?.mode === "local";

  if (!session || !gateReady) {
    return (
      <main className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Loading terminal…
      </main>
    );
  }

  if (accountFrozen) {
    return (
      <FrozenAccountGate
        username={getAccountUsername()}
        reason={accountFrozen.reason}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      showNav
      onLogout={handleLogout}
      terminal={isTerminal}
      lockProps={showLockBanner ? {
        show: true,
        locked: !lock.unlocked,
        password: lock.password,
        onPasswordChange: lock.setPassword,
        onUnlock: lock.unlock,
        onLock: lock.unlocked ? lock.lock : undefined,
        error: lock.error,
        remaining: lock.remaining,
      } : undefined}
    >
      {activeTab === "pulse" && <PulsePanel onNavigate={handleNavigate} />}

      {activeTab === "similar" && (
        <SimilarTokensPanel seedAsset={tradeAsset} onNavigate={handleNavigate} />
      )}
      {activeTab === "overview" && (
        <OverviewPanel
          session={session}
          balances={balances}
          loading={loadingBalances}
          onNavigate={handleNavigate}
          onRefresh={() => loadBalances(session)}
          onSessionChange={handleSessionChange}
          initialWalletsTab={openWalletsTab}
          showWalletWelcome={showWalletWelcome}
        />
      )}
      {activeTab === "trade" && (
        <TradePanel
          session={session}
          initialAsset={tradeAsset}
          onSuccess={() => loadBalances(session)}
        />
      )}
      {activeTab === "trackers" && <TrackersPanel />}
      {activeTab === "rewards" && <RewardsPanel />}
      {activeTab === "tweets" && <TweetMonitorPanel />}
      {activeTab === "scan" && <TraderScanPanel />}
      {activeTab === "instant" && (
        <UnlockGate
          locked={showLockBanner && !lock.unlocked}
          password={lock.password}
          onPasswordChange={lock.setPassword}
          onUnlock={lock.unlock}
          error={lock.error}
          action="use instant trade"
        >
          <InstantTradePanel onSuccess={() => loadBalances(session)} />
        </UnlockGate>
      )}
      {activeTab === "swap" && (
        <UnlockGate
          locked={showLockBanner && !lock.unlocked}
          password={lock.password}
          onPasswordChange={lock.setPassword}
          onUnlock={lock.unlock}
          error={lock.error}
          action="convert tokens"
        >
          <SwapPanel session={session} onSuccess={() => loadBalances(session)} />
        </UnlockGate>
      )}
      {activeTab === "buy" && <BuyCryptoPanel />}
      {activeTab === "fees" && <FeesPanel />}
      {activeTab === "faqs" && <FaqsPanel />}
      {activeTab === "support" && <SupportPanel />}
      {activeTab === "receive" && <ReceivePanel session={session} />}
      {activeTab === "send" && (
        <UnlockGate
          locked={showLockBanner && !lock.unlocked}
          password={lock.password}
          onPasswordChange={lock.setPassword}
          onUnlock={lock.unlock}
          error={lock.error}
          action="send funds"
        >
          <SendPanel session={session} onSuccess={() => loadBalances(session)} />
        </UnlockGate>
      )}
    </AppShell>
  );
}