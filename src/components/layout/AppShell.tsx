"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

import { ActionTabs, DashboardTab } from "@/components/dashboard/ActionTabs";
import { Button } from "@/components/ui/Button";
import { LogOut, Search, Wallet } from "lucide-react";
import type { AssetMarketData } from "@/app/api/prices/route";

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
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        {/* Preset / price strip — Axiom leading status row */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-1.5 text-[11px]">
          <span className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-medium text-[var(--muted)]">
            Preset 1
          </span>
          <span className="font-mono text-[var(--muted)]">
            SOL{" "}
            <span className="text-[var(--foreground)]">
              ${solPrice?.price.toFixed(2) ?? "—"}
            </span>
          </span>
          <span className="hidden text-[var(--muted-dim)] sm:inline">
            · Multi-chain terminal
          </span>
        </div>

        <div className="flex h-[var(--header-h)] items-center gap-2 px-4">
          <Logo href="/dashboard" compact />

          {showNav && activeTab && onTabChange && (
            <ActionTabs active={activeTab} onChange={onTabChange} />
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="hidden items-center gap-2 border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)] sm:flex"
            >
              <Search className="h-3.5 w-3.5" />
              Search
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Wallet</span>
            </Link>
            <Link
              href="/profile"
              className="ax-nav-link hidden sm:inline"
            >
              Profile
            </Link>
            <Link href="/admin" className="ax-nav-link hidden md:inline">
              Admin
            </Link>
            {onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout} className="!px-2">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main
        className={
          terminal
            ? "ax-terminal flex-1 overflow-hidden px-0"
            : "mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6"
        }
      >
        <div className={terminal ? "h-full overflow-auto px-3 py-3 sm:px-4" : ""}>
          {children}
        </div>
      </main>

    </div>
  );
}