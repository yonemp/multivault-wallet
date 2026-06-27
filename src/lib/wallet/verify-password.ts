import { deriveAllAddresses } from "@/lib/wallet/derive-all";
import {
  decryptMnemonic,
  encryptMnemonic,
  loadEncryptedWallet,
  saveEncryptedWallet,
} from "@/lib/wallet/storage";
import { saveSession, loadSession } from "@/lib/wallet/session";
import { getActiveWalletId, getVaultWallet, loadVault, saveVault } from "@/lib/wallet/wallet-vault";
import { setUnlockedMnemonic, clearUnlockedMnemonic } from "@/lib/wallet/unlock-store";

export async function decryptWalletWithPassword(password: string): Promise<string> {
  const activeId = getActiveWalletId();
  const vaultWallet = activeId ? getVaultWallet(activeId) : undefined;
  const encrypted = vaultWallet?.encryptedPayload ?? loadEncryptedWallet();
  if (!encrypted) throw new Error("No local wallet found");
  return decryptMnemonic(encrypted, password);
}

/** Verify password and optionally keep mnemonic in session (no auto timeout). */
export async function verifyWalletPassword(
  password: string,
  opts?: { persist?: boolean },
): Promise<string> {
  const mnemonic = await decryptWalletWithPassword(password);
  if (opts?.persist) {
    setUnlockedMnemonic(mnemonic);
    const current = loadSession();
    if (current) {
      const addresses = await deriveAllAddresses(mnemonic);
      saveSession({
        ...current,
        addresses,
        evmAddress: addresses.ethereum,
        solanaAddress: addresses.solana,
      });
    }
  }
  return mnemonic;
}

export async function withWalletPassword<T>(
  password: string,
  action: (mnemonic: string) => Promise<T>,
  opts?: { persist?: boolean },
): Promise<T> {
  const mnemonic = await verifyWalletPassword(password, opts);
  return action(mnemonic);
}

export function lockWalletSigning() {
  clearUnlockedMnemonic();
}

export async function changeWalletPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const mnemonic = await decryptWalletWithPassword(currentPassword);
  const encrypted = await encryptMnemonic(mnemonic, newPassword);

  const activeId = getActiveWalletId();
  if (activeId) {
    const vault = loadVault();
    saveVault(
      vault.map((w) =>
        w.id === activeId ? { ...w, encryptedPayload: encrypted } : w,
      ),
    );
  }
  saveEncryptedWallet(encrypted);
  setUnlockedMnemonic(mnemonic);
}