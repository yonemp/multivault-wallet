import type { FriendProfile } from "@/lib/platform/friends";
import {
  loadWatchedWallets,
  saveWatchedWallets,
  type WatchedWallet,
} from "@/lib/platform/watched-wallets";

export const INACTIVE_WALLET_MS = 30 * 24 * 60 * 60 * 1000;

export function isFriendWalletActive(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  const ts = Date.parse(lastSeenAt);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < INACTIVE_WALLET_MS;
}

export function syncFriendsToWatched(friends: FriendProfile[]) {
  const existing = loadWatchedWallets();
  const manual = existing.filter((w) => w.source !== "friend");

  const friendWatches: WatchedWallet[] = friends
    .filter((f) => f.primaryAddress && f.active)
    .map((f) => {
      const chain = "solana" as const;
      const address = f.primaryAddress!;
      return {
        id: `friend:${chain}:${address}`,
        address,
        label: `@${f.username}`,
        chain,
        addedAt: Date.now(),
        source: "friend" as const,
        friendUsername: f.username,
        active: true,
      };
    });

  const seen = new Set<string>();
  const merged = [...manual];
  for (const w of friendWatches) {
    if (seen.has(w.id)) continue;
    seen.add(w.id);
    const prev = existing.find((e) => e.id === w.id);
    merged.push(prev ? { ...w, addedAt: prev.addedAt } : w);
  }

  saveWatchedWallets(merged);
}

export function loadVisibleWatchedWallets(): WatchedWallet[] {
  return loadWatchedWallets().filter((w) => w.source !== "friend" || w.active !== false);
}

export function countHiddenFriendWallets(): number {
  return loadWatchedWallets().filter((w) => w.source === "friend" && w.active === false).length;
}