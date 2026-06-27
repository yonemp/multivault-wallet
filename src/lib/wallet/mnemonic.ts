import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";

export function createSeedPhrase(wordCount: 12 | 24 = 12): string {
  const strength = wordCount === 24 ? 256 : 128;
  return generateMnemonic(strength);
}

export function isValidSeedPhrase(phrase: string): boolean {
  return validateMnemonic(phrase.trim().toLowerCase());
}

export function seedFromMnemonic(mnemonic: string): Uint8Array {
  return mnemonicToSeedSync(mnemonic.trim().toLowerCase());
}