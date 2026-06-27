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
    <nav className="flex items-center gap-1 overflow-x-auto">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={clsx(
              "relative inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}