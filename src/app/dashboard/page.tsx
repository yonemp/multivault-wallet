"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { DashboardTab } from "@/components/dashboard/ActionTabs";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";
import { PulsePanel } from "@/components/dashboard/PulsePanel";
import { DiscoverPanel } from "@/components/dashboard/DiscoverPanel";
import { SimilarTokensPanel } from "@/components/dashboard/SimilarTokensPanel";
import { ReceivePanel } from "@/components/dashboard/ReceivePanel";
import { SendPanel } from "@/components/dashboard/SendPanel";
import { SwapPanel } from "@/components/dashboard/SwapPanel";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { VisionPanel } from "@/components/dashboard/VisionPanel";
import { TrackersPanel } from "@/components/dashboard/TrackersPanel";
import { PerpetualsPanel } from "@/components/dashboard/PerpetualsPanel";
import { PredictionsPanel } from "@/components/dashboard/PredictionsPanel";
import { WalletsPanel } from "@/components/dashboard/WalletsPanel";
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
import { TERMINAL_TABS } from "@/lib/navigation/axiom-nav";
import {
  ChainBalances,
  fetchChainBalances,
} from "@/lib/wallet/balances-client";
import { deriveAllAddresses } from "@/lib/wallet/derive-all";
import {
  clearSession,
  loadSession,
  saveSession,
  SessionData,
} from "@/lib/wallet/session";
import {
  clearEncryptedWallet,
  decryptMnemonic,
  loadEncryptedWallet,
} from "@/lib/wallet/storage";
import {
  clearUnlockedMnemonic,
  setUnlockedMnemonic,
} from "@/lib/wallet/unlock-store";

export default function DashboardPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [balances, setBalances] = useState<ChainBalances>({});
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("pulse");
  const [tradeAsset, setTradeAsset] = useState("sol");
  const [booting, setBooting] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    const current = loadSession();
    if (!current) {
      window.location.href = "/";
      return;
    }
    setSession(current);
    if (current.mode === "external") setUnlocked(true);
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

  async function handleUnlock() {
    setError(null);
    try {
      const encrypted = loadEncryptedWallet();
      if (!encrypted) throw new Error("No local wallet found");
      const mnemonic = await decryptMnemonic(encrypted, password);
      const addresses = await deriveAllAddresses(mnemonic);
      const current = loadSession();
      if (!current) return;
      const updated: SessionData = {
        ...current,
        addresses,
        evmAddress: addresses.ethereum,
        solanaAddress: addresses.solana,
      };
      setUnlockedMnemonic(mnemonic);
      saveSession(updated);
      setSession(updated);
      setUnlocked(true);
      await loadBalances(updated);
    } catch {
      setError("Incorrect password");
    }
  }

  function handleLogout() {
    clearUnlockedMnemonic();
    clearSession();
    clearEncryptedWallet();
    window.location.href = "/";
  }

  function handleNavigate(tab: DashboardTab, asset?: string) {
    if (asset) setTradeAsset(asset);
    setActiveTab(tab);
  }

  const ready = session && (session.mode === "external" || unlocked);
  const hasAddresses = session != null && Object.keys(session.addresses).length > 0;
  const showNav = ready || hasAddresses;
  const isTerminal = TERMINAL_TABS.includes(activeTab);

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
          activeTab={showNav ? activeTab : undefined}
          onTabChange={setActiveTab}
          showNav={showNav}
          onLogout={handleLogout}
          terminal={isTerminal}
        >
          {session.mode === "local" && !unlocked && (
            <div className="mx-auto mb-3 max-w-sm">
              <Panel className="p-4">
                <p className="text-sm font-semibold">Unlock wallet</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Required for on-chain send, swap, and sniper execution
                </p>
                <div className="mt-3 space-y-2">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  />
                  {error && <p className="mv-alert-error text-xs">{error}</p>}
                  <Button className="w-full" onClick={handleUnlock}>
                    Unlock
                  </Button>
                </div>
              </Panel>
            </div>
          )}

          {showNav && (
            <>
              {activeTab === "pulse" && <PulsePanel onNavigate={handleNavigate} />}
              {activeTab === "discover" && <DiscoverPanel onNavigate={handleNavigate} />}
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
              {activeTab === "perpetuals" && <PerpetualsPanel />}
              {activeTab === "predictions" && <PredictionsPanel />}
              {activeTab === "vision" && <VisionPanel />}
              {activeTab === "rewards" && <RewardsPanel />}
              {activeTab === "tweets" && <TweetMonitorPanel />}
              {activeTab === "scan" && <TraderScanPanel />}
              {activeTab === "instant" && (
                <InstantTradePanel onSuccess={() => session && loadBalances(session)} />
              )}
              {activeTab === "swap" &&
                (ready ? (
                  <SwapPanel session={session} onSuccess={() => session && loadBalances(session)} />
                ) : (
                  <p className="text-sm text-[var(--muted)]">Unlock to convert tokens</p>
                ))}
              {activeTab === "buy" && <BuyCryptoPanel />}
              {activeTab === "wallets" && <WalletsPanel />}
              {activeTab === "fees" && <FeesPanel />}
              {activeTab === "faqs" && <FaqsPanel />}
              {activeTab === "support" && <SupportPanel />}
              {activeTab === "receive" && hasAddresses && <ReceivePanel session={session} />}
              {activeTab === "send" &&
                (ready ? (
                  <SendPanel session={session} onSuccess={() => session && loadBalances(session)} />
                ) : (
                  <p className="text-sm text-[var(--muted)]">Unlock to send</p>
                ))}
            </>
          )}
        </AppShell>
      )}
    </>
  );
}