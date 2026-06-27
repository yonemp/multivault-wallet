import { getLegacyItem } from "@/lib/storage/legacy-keys";

const KEY = "tackers_limit_orders";

export type LimitOrder = {
  id: string;
  asset: string;
  side: "buy" | "sell";
  price: number;
  amount: number;
  status: "open" | "filled" | "cancelled";
  createdAt: number;
  type: "limit" | "sniper";
};

export function loadLimitOrders(): LimitOrder[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(getLegacyItem(KEY) ?? "[]") as LimitOrder[];
  } catch {
    return [];
  }
}

export function saveLimitOrders(orders: LimitOrder[]) {
  localStorage.setItem(KEY, JSON.stringify(orders));
}

export function addLimitOrder(
  order: Omit<LimitOrder, "id" | "status" | "createdAt">,
) {
  const orders = loadLimitOrders();
  const next: LimitOrder = {
    ...order,
    id: crypto.randomUUID(),
    status: "open",
    createdAt: Date.now(),
  };
  saveLimitOrders([next, ...orders]);
  return next;
}

export function cancelLimitOrder(id: string) {
  saveLimitOrders(
    loadLimitOrders().map((o) =>
      o.id === id ? { ...o, status: "cancelled" as const } : o,
    ),
  );
}