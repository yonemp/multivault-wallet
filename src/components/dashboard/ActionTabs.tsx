"use client";

import { CORE_NAV } from "@/lib/navigation/axiom-nav";
import { DashboardTab } from "./ActionTabs.types";

export type { DashboardTab };

type ActionTabsProps = {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
};

export function ActionTabs({ active, onChange }: ActionTabsProps) {
  const isCoreActive = CORE_NAV.some((n) => n.id === active);

  return (
    <nav className="flex items-center overflow-x-auto">
      {CORE_NAV.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          data-active={active === id ? "true" : "false"}
          className="ax-nav-tab shrink-0 py-3"
        >
          {label}
        </button>
      ))}
      {!isCoreActive && active !== "trade" && (
        <span className="ml-2 shrink-0 rounded border border-[var(--border)] px-2 py-0.5 text-[10px] capitalize text-[var(--primary)]">
          {active}
        </span>
      )}
    </nav>
  );
}