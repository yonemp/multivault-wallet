import { getLegacyItem } from "@/lib/storage/legacy-keys";

const KEY = "tackers_managed_wallets";

export type ManagedWallet = {
  id: string;
  label: string;
  address: string;
  balance: number;
  holdings: number;
  archived?: boolean;
  color?: string;
};

export function loadManagedWallets(): ManagedWallet[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(getLegacyItem(KEY) ?? "[]") as ManagedWallet[];
  } catch {
    return [];
  }
}

export function saveManagedWallets(wallets: ManagedWallet[]) {
  localStorage.setItem(KEY, JSON.stringify(wallets));
}

export function addManagedWallet(input: { label: string; address: string }) {
  const wallets = loadManagedWallets();
  const id = `mw-${Date.now()}`;
  const next: ManagedWallet = {
    id,
    label: input.label,
    address: input.address,
    balance: 0,
    holdings: 0,
    color: "#f5a623",
  };
  saveManagedWallets([...wallets, next]);
  return next;
}

export function updateManagedWallet(id: string, patch: Partial<ManagedWallet>) {
  const wallets = loadManagedWallets().map((w) => (w.id === id ? { ...w, ...patch } : w));
  saveManagedWallets(wallets);
}

export function removeManagedWallet(id: string) {
  saveManagedWallets(loadManagedWallets().filter((w) => w.id !== id));
}

export function exportWalletsJson(): string {
  return JSON.stringify(loadManagedWallets(), null, 2);
}

export function importWalletsJson(raw: string) {
  const data = JSON.parse(raw) as ManagedWallet[];
  if (!Array.isArray(data)) throw new Error("Invalid file");
  const existing = loadManagedWallets();
  const merged = [...existing];
  for (const w of data) {
    if (!w.address || !w.label) continue;
    if (merged.some((m) => m.address === w.address)) continue;
    merged.push({ ...w, id: w.id || `mw-${Date.now()}-${Math.random()}` });
  }
  saveManagedWallets(merged);
  return merged;
}