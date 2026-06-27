const KEY = "multivault_recent_memecoins";
export const RECENT_MEMECOINS_EVENT = "mv-recent-memecoins-changed";
const MAX_RECENT = 16;

export type RecentMemecoin = {
  assetId: string;
  symbol: string;
  name?: string;
  imageUri?: string;
  visitedAt: number;
};

export type MemecoinVisitMeta = {
  symbol?: string;
  name?: string;
  imageUri?: string;
};

export function isMemecoinAssetId(assetId: string) {
  if (!assetId.startsWith("sol-")) return false;
  const mint = assetId.slice(4);
  return mint.length >= 32;
}

function fallbackSymbol(assetId: string) {
  return assetId.slice(4, 8).toUpperCase();
}

export function loadRecentMemecoins(): RecentMemecoin[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentMemecoin[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveRecentMemecoins(coins: RecentMemecoin[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(coins.slice(0, MAX_RECENT)));
}

export function notifyRecentMemecoinsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(RECENT_MEMECOINS_EVENT));
}

export function recordMemecoinVisit(
  entry: MemecoinVisitMeta & { assetId: string; visitedAt?: number },
) {
  const visitedAt = entry.visitedAt ?? Date.now();
  const nextEntry: RecentMemecoin = {
    assetId: entry.assetId,
    symbol: entry.symbol?.trim() || fallbackSymbol(entry.assetId),
    name: entry.name,
    imageUri: entry.imageUri,
    visitedAt,
  };

  const rest = loadRecentMemecoins().filter((c) => c.assetId !== entry.assetId);
  saveRecentMemecoins([nextEntry, ...rest]);
  notifyRecentMemecoinsChanged();
}

export function tryRecordMemecoinVisit(assetId?: string, meta?: MemecoinVisitMeta) {
  if (!assetId || !isMemecoinAssetId(assetId)) return;
  recordMemecoinVisit({ assetId, ...meta });
}

export function removeRecentMemecoin(assetId: string) {
  saveRecentMemecoins(loadRecentMemecoins().filter((c) => c.assetId !== assetId));
  notifyRecentMemecoinsChanged();
}