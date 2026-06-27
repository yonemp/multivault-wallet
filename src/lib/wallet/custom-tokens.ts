import { getLegacyItem } from "@/lib/storage/legacy-keys";
import { ChainId } from "./chains";

export type CustomToken = {
  id: string;
  symbol: string;
  name: string;
  chain: ChainId | "bsc";
  contractOrMint: string;
  decimals: number;
  logoUrl?: string;
  addedAt: number;
};

const STORAGE_KEY = "tackers_custom_tokens";

export function loadCustomTokens(): CustomToken[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = getLegacyItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomToken[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomTokens(tokens: CustomToken[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function addCustomToken(token: Omit<CustomToken, "id" | "addedAt">) {
  const tokens = loadCustomTokens();
  const id = `${token.chain}:${token.contractOrMint.toLowerCase()}`;
  if (tokens.some((t) => t.id === id)) {
    throw new Error("Token already added");
  }
  const next: CustomToken = { ...token, id, addedAt: Date.now() };
  saveCustomTokens([...tokens, next]);
  return next;
}

export function removeCustomToken(id: string) {
  saveCustomTokens(loadCustomTokens().filter((t) => t.id !== id));
}

export function getCustomTokensForChain(chain: ChainId | "bsc") {
  return loadCustomTokens().filter((t) => t.chain === chain);
}