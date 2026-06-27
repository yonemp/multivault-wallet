import { getLegacyItem } from "@/lib/storage/legacy-keys";
import { WalletAddresses } from "./session";
import { loadEncryptedWallet } from "./storage";

export type VaultWallet = {
  id: string;
  label: string;
  walletType: "created" | "imported";
  encryptedPayload: string;
  addresses: WalletAddresses;
  color: string;
  createdAt: number;
};

const VAULT_KEY = "tackers_wallet_vault";
const ACTIVE_ID_KEY = "tackers_active_wallet_id";

const COLORS = ["#f5a623", "#5b7aff", "#00c076", "#9945ff", "#ff6b6b", "#4ecdc4"];

export function loadVault(): VaultWallet[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(getLegacyItem(VAULT_KEY) ?? "[]") as VaultWallet[];
  } catch {
    return [];
  }
}

export function saveVault(wallets: VaultWallet[]) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(wallets));
}

export function getVaultWallet(id: string): VaultWallet | undefined {
  return loadVault().find((w) => w.id === id);
}

export function getActiveWalletId(): string | null {
  if (typeof window === "undefined") return null;
  return getLegacyItem(ACTIVE_ID_KEY);
}

export function setActiveWalletId(id: string) {
  localStorage.setItem(ACTIVE_ID_KEY, id);
}

export function addVaultWallet(input: Omit<VaultWallet, "id" | "createdAt" | "color"> & { color?: string }): VaultWallet {
  const vault = loadVault();
  const sol = input.addresses.solana ?? "";
  if (sol && vault.some((w) => w.addresses.solana === sol)) {
    throw new Error("This wallet is already in your vault");
  }
  const wallet: VaultWallet = {
    ...input,
    id: `vw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    color: input.color ?? COLORS[vault.length % COLORS.length],
    createdAt: Date.now(),
  };
  saveVault([...vault, wallet]);
  return wallet;
}

export function updateVaultWallet(id: string, patch: Partial<Pick<VaultWallet, "label" | "color">>) {
  saveVault(loadVault().map((w) => (w.id === id ? { ...w, ...patch } : w)));
}

export function removeVaultWallet(id: string) {
  const next = loadVault().filter((w) => w.id !== id);
  saveVault(next);
  const active = getActiveWalletId();
  if (active === id && next.length) {
    setActiveWalletId(next[0].id);
  } else if (!next.length) {
    localStorage.removeItem(ACTIVE_ID_KEY);
  }
}

export function vaultWalletCount(): number {
  return loadVault().length;
}

/** Migrate legacy single-wallet storage into the vault (one-time). */
export function migrateLegacyWallet(session: {
  mode: string;
  walletType: string;
  addresses: WalletAddresses;
} | null): VaultWallet | null {
  const vault = loadVault();
  if (vault.length > 0) return null;

  const legacy = loadEncryptedWallet();
  if (!legacy || !session?.addresses?.solana || session.mode !== "local") return null;
  if (session.walletType !== "created" && session.walletType !== "imported") return null;

  const wallet = addVaultWallet({
    label: session.walletType === "created" ? "Main Wallet" : "Imported Wallet",
    walletType: session.walletType as "created" | "imported",
    encryptedPayload: legacy,
    addresses: session.addresses,
  });
  setActiveWalletId(wallet.id);
  return wallet;
}