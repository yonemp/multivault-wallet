const UNLOCK_KEY = "mv_wallet_unlock";

type UnlockSession = {
  mnemonic: string;
  unlockedAt: number;
};

function readSession(): UnlockSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(UNLOCK_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UnlockSession;
  } catch {
    return null;
  }
}

function writeSession(data: UnlockSession) {
  sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(data));
}

export function isUnlockValid(): boolean {
  return readSession() !== null;
}

export function getUnlockMnemonic(): string | null {
  return readSession()?.mnemonic ?? null;
}

export function unlockWalletSession(mnemonic: string) {
  writeSession({ mnemonic, unlockedAt: Date.now() });
}

export function clearUnlockSession() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(UNLOCK_KEY);
  }
}