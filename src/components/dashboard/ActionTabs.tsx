"use client";

import { DashboardTab } from "./ActionTabs.types";

export type { DashboardTab };

const tabs: { id: DashboardTab; label: string }[] = [
  { id: "pulse", label: "Pulse" },
  { id: "overview", label: "Portfolio" },
  { id: "trade", label: "Trade" },
  { id: "swap", label: "Swap" },
  { id: "send", label: "Send" },
  { id: "receive", label: "Receive" },
];

type ActionTabsProps = {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
};

export function ActionTabs({ active, onChange }: ActionTabsProps) {
  return (
    <nav className="flex items-center overflow-x-auto">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          data-active={active === id}
          className="ax-nav-link relative py-3"
        >
          {label}
          {active === id && (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--primary)]" />
          )}
        </button>
      ))}
    </nav>
  );
}