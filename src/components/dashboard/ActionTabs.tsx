import clsx from "clsx";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  LayoutGrid,
} from "lucide-react";

export type DashboardTab = "overview" | "send" | "receive" | "swap";

const tabs: { id: DashboardTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "send", label: "Send", icon: ArrowUpRight },
  { id: "receive", label: "Receive", icon: ArrowDownLeft },
  { id: "swap", label: "Swap", icon: ArrowLeftRight },
];

type ActionTabsProps = {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
};

export function ActionTabs({ active, onChange }: ActionTabsProps) {
  return (
    <nav className="flex items-center gap-0 overflow-x-auto border border-slate-200 bg-white">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={clsx(
              "relative inline-flex shrink-0 items-center gap-2 border-r border-slate-200 px-4 py-2 text-sm font-medium transition last:border-r-0",
              isActive
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}