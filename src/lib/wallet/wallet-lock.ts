const UNLOCK_KEY = "mv_wallet_unlock";
export const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

type UnlockSession = {
  mnemonic: string;
  lastActivity: number;
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
  const data = readSession();
  if (!data) return false;
  return Date.now() - data.lastActivity < LOCK_TIMEOUT_MS;
}

export function getUnlockMnemonic(): string | null {
  const data = readSession();
  if (!data) return null;
  if (Date.now() - data.lastActivity >= LOCK_TIMEOUT_MS) {
    clearUnlockSession();
    return null;
  }
  return data.mnemonic;
}

export function unlockWalletSession(mnemonic: string) {
  writeSession({ mnemonic, lastActivity: Date.now() });
}

export function touchUnlockActivity() {
  const data = readSession();
  if (!data) return;
  data.lastActivity = Date.now();
  writeSession(data);
}

export function clearUnlockSession() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(UNLOCK_KEY);
  }
}

export function getLockRemainingMs(): number {
  const data = readSession();
  if (!data) return 0;
  return Math.max(0, LOCK_TIMEOUT_MS - (Date.now() - data.lastActivity));
}

export function formatLockRemaining(ms: number) {
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}