let unlockedMnemonic: string | null = null;

export function setUnlockedMnemonic(mnemonic: string) {
  unlockedMnemonic = mnemonic;
}

export function getUnlockedMnemonic() {
  return unlockedMnemonic;
}

export function clearUnlockedMnemonic() {
  unlockedMnemonic = null;
}