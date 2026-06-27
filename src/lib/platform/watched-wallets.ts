const KEY = "multivault_watched_wallets";

export type WatchedWallet = {
  id: string;
  address: string;
  label: string;
  chain: "solana" | "ethereum";
  addedAt: number;
  pnl?: string;
  winRate?: number;
};

export function loadWatchedWallets(): WatchedWallet[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as WatchedWallet[];
  } catch {
    return [];
  }
}

export function saveWatchedWallets(wallets: WatchedWallet[]) {
  localStorage.setItem(KEY, JSON.stringify(wallets));
}

export function addWatchedWallet(input: {
  address: string;
  label: string;
  chain: "solana" | "ethereum";
}) {
  const wallets = loadWatchedWallets();
  const id = `${input.chain}:${input.address}`;
  if (wallets.some((w) => w.id === id)) throw new Error("Wallet already tracked");
  const next: WatchedWallet = {
    id,
    ...input,
    addedAt: Date.now(),
  };
  saveWatchedWallets([...wallets, next]);
  return next;
}

export function removeWatchedWallet(id: string) {
  saveWatchedWallets(loadWatchedWallets().filter((w) => w.id !== id));
}