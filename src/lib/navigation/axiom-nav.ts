import { DashboardTab } from "@/components/dashboard/ActionTabs.types";

export type NavItem = {
  id: DashboardTab;
  label: string;
  group: "core" | "more";
};

export const CORE_NAV: NavItem[] = [
  { id: "pulse", label: "Pulse", group: "core" },
  { id: "discover", label: "Discover", group: "core" },
  { id: "trade", label: "Trade", group: "core" },
  { id: "overview", label: "Portfolio", group: "core" },
  { id: "vision", label: "Vision", group: "core" },
  { id: "rewards", label: "Rewards", group: "core" },
];

export const MORE_NAV: NavItem[] = [
  { id: "similar", label: "Similar Tokens", group: "more" },
  { id: "tweets", label: "Tweet Monitor", group: "more" },
  { id: "scan", label: "Trader Scan", group: "more" },
  { id: "swap", label: "Convert", group: "more" },
  { id: "instant", label: "Instant Trade", group: "more" },
  { id: "buy", label: "Buy Crypto", group: "more" },
  { id: "wallets", label: "Multi-wallet", group: "more" },
  { id: "fees", label: "Fees", group: "more" },
  { id: "faqs", label: "FAQs", group: "more" },
  { id: "support", label: "Support", group: "more" },
  { id: "send", label: "Send", group: "more" },
  { id: "receive", label: "Receive", group: "more" },
];

export const TERMINAL_TABS: DashboardTab[] = [
  "pulse",
  "discover",
  "trade",
  "vision",
  "tweets",
  "scan",
];