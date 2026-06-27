export type WalletZone = "active" | "source" | "dest";

export type WalletLayout = {
  sourceIds: string[];
  destIds: string[];
};

import { getLegacyItem } from "@/lib/storage/legacy-keys";

const KEY = "tackers_wallet_layout";

export function loadWalletLayout(): WalletLayout {
  if (typeof window === "undefined") return { sourceIds: [], destIds: [] };
  try {
    const raw = JSON.parse(getLegacyItem(KEY) ?? "{}") as WalletLayout;
    return {
      sourceIds: raw.sourceIds ?? [],
      destIds: raw.destIds ?? [],
    };
  } catch {
    return { sourceIds: [], destIds: [] };
  }
}

export function saveWalletLayout(layout: WalletLayout) {
  localStorage.setItem(KEY, JSON.stringify(layout));
}

export function moveWalletToZone(walletId: string, zone: WalletZone, allIds: string[]): WalletLayout {
  const layout = loadWalletLayout();
  const sourceIds = layout.sourceIds.filter((id) => id !== walletId);
  const destIds = layout.destIds.filter((id) => id !== walletId);

  if (zone === "source") sourceIds.push(walletId);
  if (zone === "dest") destIds.push(walletId);

  const validSource = sourceIds.filter((id) => allIds.includes(id));
  const validDest = destIds.filter((id) => allIds.includes(id));
  const next = { sourceIds: validSource, destIds: validDest };
  saveWalletLayout(next);
  return next;
}

export function getActiveWalletIds(allIds: string[]): string[] {
  const { sourceIds, destIds } = loadWalletLayout();
  const assigned = new Set([...sourceIds, ...destIds]);
  return allIds.filter((id) => !assigned.has(id));
}

export function getWalletZone(walletId: string): WalletZone {
  const { sourceIds, destIds } = loadWalletLayout();
  if (sourceIds.includes(walletId)) return "source";
  if (destIds.includes(walletId)) return "dest";
  return "active";
}