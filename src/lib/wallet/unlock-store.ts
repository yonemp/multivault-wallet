import {
  clearUnlockSession,
  getUnlockMnemonic,
  unlockWalletSession,
} from "./wallet-lock";

let unlockedMnemonic: string | null = null;

export function setUnlockedMnemonic(mnemonic: string) {
  unlockedMnemonic = mnemonic;
  unlockWalletSession(mnemonic);
}

export function getUnlockedMnemonic() {
  if (unlockedMnemonic) return unlockedMnemonic;
  const restored = getUnlockMnemonic();
  if (restored) unlockedMnemonic = restored;
  return unlockedMnemonic;
}

export function clearUnlockedMnemonic() {
  unlockedMnemonic = null;
  clearUnlockSession();
}

export function restoreUnlockFromSession(): boolean {
  const mnemonic = getUnlockMnemonic();
  if (!mnemonic) return false;
  unlockedMnemonic = mnemonic;
  return true;
}