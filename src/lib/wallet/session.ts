import { ChainId } from "./chains";

export type WalletAddresses = Partial<Record<ChainId, string>>;

export type SessionData = {
  mode: "local" | "external";
  walletType: "created" | "imported" | "metamask" | "phantom" | "trust";
  addresses: WalletAddresses;
  /** @deprecated use addresses.ethereum */
  evmAddress?: string;
  /** @deprecated use addresses.solana */
  solanaAddress?: string;
};

const SESSION_KEY = "multivault_session";

function migrateSession(raw: SessionData): SessionData {
  if (raw.addresses) return raw;
  const addresses: WalletAddresses = {};
  if (raw.evmAddress) addresses.ethereum = raw.evmAddress;
  if (raw.solanaAddress) addresses.solana = raw.solanaAddress;
  return { ...raw, addresses };
}

export function saveSession(session: SessionData) {
  const addresses = { ...session.addresses };
  if (addresses.ethereum) session.evmAddress = addresses.ethereum;
  if (addresses.solana) session.solanaAddress = addresses.solana;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, addresses }));
}

export function loadSession(): SessionData | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return migrateSession(JSON.parse(raw) as SessionData);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSessionChains(session: SessionData): ChainId[] {
  return Object.keys(session.addresses).filter(
    (k) => session.addresses[k as ChainId],
  ) as ChainId[];
}

export function getAddress(session: SessionData, chain: ChainId) {
  return session.addresses[chain];
}