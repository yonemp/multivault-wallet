"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { ActionTabs, DashboardTab } from "@/components/dashboard/ActionTabs";
import { Button } from "@/components/ui/Button";
import { LogOut, Search, Wallet } from "lucide-react";
import type { AssetMarketData } from "@/app/api/prices/route";
import { safeFixed, safeNumber } from "@/lib/format/numbers";

type AppShellProps = {
  children: ReactNode;
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  showNav?: boolean;
  onLogout?: () => void;
  terminal?: boolean;
};

export function AppShell({
  children,
  activeTab,
  onTabChange,
  showNav = true,
  onLogout,
  terminal = true,
}: AppShellProps) {
  const [solPrice, setSolPrice] = useState<AssetMarketData | null>(null);

  useEffect(() => {
    fetch("/api/prices?assets=sol")
      .then((r) => r.json())
      .then((d) => setSolPrice(d.assets?.sol ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-elevated)]/90 backdrop-blur-xl">
        <div className="mv-header-glow h-px w-full" />

        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-1.5 text-[11px]">
          <span className="mv-preset-pill">Preset 1</span>
          <span className="font-mono text-[var(--muted)]">
            SOL{" "}
            <span className="text-[var(--foreground)]">${safeFixed(solPrice?.price, 2)}</span>
            {solPrice && Number.isFinite(safeNumber(solPrice.change24h, NaN)) && (
              <span className={`ml-1 ${safeNumber(solPrice.change24h) >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                {safeNumber(solPrice.change24h) >= 0 ? "+" : ""}{safeFixed(solPrice.change24h, 2)}%
              </span>
            )}
          </span>
          <span className="hidden text-[var(--muted-dim)] sm:inline">· Live · CoinGecko + pump.fun</span>
        </div>

        <div className="flex h-[var(--header-h)] items-center gap-2 px-4">
          <Logo href="/dashboard" compact />

          {showNav && activeTab && onTabChange && (
            <ActionTabs active={activeTab} onChange={onTabChange} />
          )}

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button type="button" className="mv-header-btn hidden sm:flex">
              <Search className="h-3.5 w-3.5" />
              Search
            </button>
            <Link href="/dashboard" className="mv-header-btn">
              <Wallet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Wallet</span>
            </Link>
            <Link href="/profile" className="ax-nav-link hidden sm:inline">Profile</Link>
            <Link href="/admin" className="ax-nav-link hidden md:inline">Admin</Link>
            {onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout} className="!px-2">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className={terminal ? "ax-terminal flex-1 overflow-hidden px-0" : "mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6"}>
        <div className={terminal ? "h-full overflow-auto px-3 py-3 sm:px-4" : ""}>
          {children}
        </div>
      </main>
    </div>
  );
}