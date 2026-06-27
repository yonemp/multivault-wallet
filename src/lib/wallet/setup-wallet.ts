import { buildSignInMessage } from "@/lib/auth/message";
import { deriveAllAddresses } from "./derive-all";
import { deriveEvmWallet } from "./evm";
import { deriveSolanaKeypair } from "./solana";
import { registerWallet } from "./register";
import { saveSession, SessionData } from "./session";
import { encryptMnemonic } from "./storage";
import { setUnlockedMnemonic } from "./unlock-store";
import {
  addVaultWallet,
  setActiveWalletId,
  VaultWallet,
} from "./wallet-vault";
import nacl from "tweetnacl";

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...Array.from(bytes)));
}

export type SetupWalletResult = {
  vaultWallet: VaultWallet;
  session: SessionData;
};

export async function setupLocalWallet(opts: {
  mnemonic: string;
  password: string;
  walletType: "created" | "imported";
  label?: string;
  makeActive?: boolean;
}): Promise<SetupWalletResult> {
  const { mnemonic, password, walletType, label, makeActive = true } = opts;

  const evmWallet = deriveEvmWallet(mnemonic);
  const solanaKeypair = deriveSolanaKeypair(mnemonic);
  const encrypted = await encryptMnemonic(mnemonic, password);
  const addresses = await deriveAllAddresses(mnemonic);

  const evmMessage = buildSignInMessage(evmWallet.address, "ethereum");
  const evmSignature = await evmWallet.signMessage(evmMessage);
  await registerWallet({
    address: evmWallet.address,
    chain: "ethereum",
    walletType,
    message: evmMessage,
    signature: evmSignature,
  });

  const solMessage = buildSignInMessage(solanaKeypair.publicKey.toBase58(), "solana");
  const solSignature = toBase64(
    nacl.sign.detached(new TextEncoder().encode(solMessage), solanaKeypair.secretKey),
  );
  await registerWallet({
    address: solanaKeypair.publicKey.toBase58(),
    chain: "solana",
    walletType,
    message: solMessage,
    signature: solSignature,
  });

  const defaultLabel =
    label ??
    (walletType === "created" ? `Wallet ${Date.now().toString(36).slice(-4)}` : "Imported Wallet");

  const vaultWallet = addVaultWallet({
    label: defaultLabel,
    walletType,
    encryptedPayload: encrypted,
    addresses,
  });

  if (makeActive) {
    setActiveWalletId(vaultWallet.id);
    setUnlockedMnemonic(mnemonic);
  }

  const session: SessionData = {
    mode: "local",
    walletType,
    addresses,
    activeWalletId: makeActive ? vaultWallet.id : undefined,
    evmAddress: evmWallet.address,
    solanaAddress: solanaKeypair.publicKey.toBase58(),
  };

  if (makeActive) saveSession(session);

  return { vaultWallet, session };
}

export function sessionFromVaultWallet(wallet: VaultWallet): SessionData {
  return {
    mode: "local",
    walletType: wallet.walletType,
    addresses: wallet.addresses,
    activeWalletId: wallet.id,
    evmAddress: wallet.addresses.ethereum,
    solanaAddress: wallet.addresses.solana,
  };
}