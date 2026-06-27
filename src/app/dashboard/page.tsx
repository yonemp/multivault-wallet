"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
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
} from "@/lib/wallet/session";
import { clearUnlockedMnemonic } from "@/lib/wallet/unlock-store";
import { clearEncryptedWallet } from "@/lib/wallet/storage";

export default function DashboardPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [balances, setBalances] = useState<ChainBalances>({});
  const [activeTab, setActiveTab] = useState<DashboardTab>("pulse");
  const [tradeAsset, setTradeAsset] = useState("sol");
  const [booting, setBooting] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);

  const lock = useWalletLock(session);

  useEffect(() => {
    const current = loadSession();
    if (!current) {
      window.location.href = "/";
      return;
    }
    setSession(current);
    if (Object.keys(current.addresses).length > 0) loadBalances(current);
  }, []);

  async function loadBalances(current: SessionData) {
    setLoadingBalances(true);
    try {
      setBalances(await fetchChainBalances(current.addresses));
    } finally {
      setLoadingBalances(false);
    }
  }

  function handleLogout() {
    lock.lock();
    clearUnlockedMnemonic();
    clearSession();
    clearEncryptedWallet();
    window.location.href = "/";
  }

  function handleNavigate(tab: DashboardTab, asset?: string) {
    if (asset) setTradeAsset(asset);
    setActiveTab(tab);
  }

  const isTerminal = TERMINAL_TABS.includes(activeTab);
  const showLockBanner = session?.mode === "local";

  return (
    <>
      <AnimatePresence>
        {booting && (
          <LoadingScreen
            submessage="Loading Pulse · Discover · Trade terminal"
            onComplete={() => setBooting(false)}
          />
        )}
      </AnimatePresence>

      {!session ? (
        <main className="flex min-h-screen items-center justify-center text-[var(--muted)]">
          Loading...
        </main>
      ) : (
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
              onRefresh={() => session && loadBalances(session)}
            />
          )}
          {activeTab === "trade" && (
            <TradePanel
              session={session}
              initialAsset={tradeAsset}
              onSuccess={() => session && loadBalances(session)}
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
              <InstantTradePanel onSuccess={() => session && loadBalances(session)} />
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
              <SwapPanel session={session} onSuccess={() => session && loadBalances(session)} />
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
              <SendPanel session={session} onSuccess={() => session && loadBalances(session)} />
            </UnlockGate>
          )}
        </AppShell>
      )}
    </>
  );
}