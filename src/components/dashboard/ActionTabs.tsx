"use client";

import { useEffect, useRef, useState } from "react";
import { CORE_NAV, MORE_NAV } from "@/lib/navigation/axiom-nav";
import { DashboardTab } from "./ActionTabs.types";
import { ChevronDown } from "lucide-react";

export type { DashboardTab };

type ActionTabsProps = {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
};

export function ActionTabs({ active, onChange }: ActionTabsProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const isMoreActive = MORE_NAV.some((n) => n.id === active);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <nav className="flex items-center overflow-x-auto">
      {CORE_NAV.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          data-active={active === id}
          className="ax-nav-link relative shrink-0 py-3"
        >
          {label}
          {active === id && (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--primary)]" />
          )}
        </button>
      ))}

      <div ref={moreRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className={`ax-nav-link flex items-center gap-1 py-3 ${isMoreActive ? "text-[var(--foreground)]" : ""}`}
        >
          More
          <ChevronDown className={`h-3 w-3 transition ${moreOpen ? "rotate-180" : ""}`} />
          {isMoreActive && (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--primary)]" />
          )}
        </button>
        {moreOpen && (
          <div className="absolute left-0 top-full z-50 mt-0 min-w-[180px] border border-[var(--border-strong)] bg-[var(--surface-solid)] py-1 shadow-[var(--shadow-md)]">
            {MORE_NAV.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onChange(id);
                  setMoreOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-xs transition hover:bg-[var(--surface-hover)] ${
                  active === id ? "text-[var(--primary)]" : "text-[var(--muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}