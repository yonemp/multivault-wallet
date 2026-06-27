"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { ActionTabs, DashboardTab } from "@/components/dashboard/ActionTabs";
import { LogOut, User, Crown } from "lucide-react";

type AppShellProps = {
  children: ReactNode;
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  showNav?: boolean;
  onLogout?: () => void;
  maxWidth?: "6xl" | "7xl" | "full";
};

export function AppShell({
  children,
  activeTab,
  onTabChange,
  showNav = true,
  onLogout,
  maxWidth = "7xl",
}: AppShellProps) {
  const widthClass =
    maxWidth === "full" ? "max-w-none" : maxWidth === "6xl" ? "max-w-6xl" : "max-w-7xl";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl">
        <div className={`mx-auto flex w-full ${widthClass} items-center gap-3 px-4 py-3 sm:px-6`}>
          <Logo href="/dashboard" compact />

          {showNav && activeTab && onTabChange && (
            <div className="flex flex-1 items-center justify-start overflow-x-auto">
              <ActionTabs active={activeTab} onChange={onTabChange} />
            </div>
          )}

          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/profile"
              className="flex items-center gap-1.5 border border-transparent px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--border)] hover:text-[var(--primary)]"
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-1.5 border border-transparent px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--border)] hover:text-amber-700"
            >
              <Crown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
            {onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout} className="shrink-0">
                <LogOut className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className={`mx-auto w-full ${widthClass} px-4 py-5 sm:px-6`}>
        {children}
      </main>
    </div>
  );
}