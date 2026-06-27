const UNLOCK_KEY = "mv_wallet_unlock";
const AWAY_KEY = "mv_wallet_away_at";
export const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

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

/** Called when user leaves the tab/site. */
export function markSiteAway() {
  sessionStorage.setItem(AWAY_KEY, String(Date.now()));
}

/** Returns true if unlock should remain valid after returning. */
export function checkReturnFromAway(): boolean {
  const awayRaw = sessionStorage.getItem(AWAY_KEY);
  sessionStorage.removeItem(AWAY_KEY);
  if (!awayRaw) return true;
  const awayMs = Date.now() - Number(awayRaw);
  if (awayMs >= LOCK_TIMEOUT_MS) {
    clearUnlockSession();
    return false;
  }
  return true;
}

export function isUnlockValid(): boolean {
  return readSession() !== null;
}

export function getUnlockMnemonic(): string | null {
  return readSession()?.mnemonic ?? null;
}

export function unlockWalletSession(mnemonic: string) {
  writeSession({ mnemonic, unlockedAt: Date.now() });
  sessionStorage.removeItem(AWAY_KEY);
}

export function touchUnlockActivity() {
  /* No-op: we no longer lock on inactivity while on-site. */
}

export function clearUnlockSession() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(UNLOCK_KEY);
  }
}

export function getLockRemainingMs(): number {
  const awayRaw = sessionStorage.getItem(AWAY_KEY);
  if (awayRaw) {
    const elapsed = Date.now() - Number(awayRaw);
    return Math.max(0, LOCK_TIMEOUT_MS - elapsed);
  }
  return LOCK_TIMEOUT_MS;
}

export function formatLockRemaining(ms: number) {
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** On fresh page load, lock if user was away longer than timeout. */
export function shouldLockOnBoot(): boolean {
  const awayRaw = sessionStorage.getItem(AWAY_KEY);
  if (!awayRaw) return false;
  const awayMs = Date.now() - Number(awayRaw);
  if (awayMs >= LOCK_TIMEOUT_MS) {
    clearUnlockSession();
    sessionStorage.removeItem(AWAY_KEY);
    return true;
  }
  sessionStorage.removeItem(AWAY_KEY);
  return false;
}