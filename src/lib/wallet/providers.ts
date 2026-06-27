import { buildSignInMessage } from "@/lib/auth/message";

export type WalletProvider = "metamask" | "phantom" | "trust";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isTrust?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        publicKey?: { toString: () => string };
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        signMessage: (
          message: Uint8Array,
          encoding: string,
        ) => Promise<{ signature: Uint8Array }>;
        signAndSendTransaction: (
          tx: import("@solana/web3.js").Transaction | import("@solana/web3.js").VersionedTransaction,
        ) => Promise<{ signature: string }>;
        disconnect: () => Promise<void>;
      };
    };
  }
}

export async function connectMetaMask() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }
  if (window.ethereum.isTrust) {
    throw new Error("Trust Wallet detected. Use the Trust option instead.");
  }

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];

  return accounts[0];
}

export async function connectTrustWallet() {
  if (!window.ethereum) {
    throw new Error("Trust Wallet is not installed");
  }

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];

  return accounts[0];
}

export async function signEvmMessage(address: string, provider: WalletProvider) {
  if (!window.ethereum) {
    throw new Error("No EVM wallet found");
  }

  const message = buildSignInMessage(address, "ethereum");
  const signature = (await window.ethereum.request({
    method: "personal_sign",
    params: [message, address],
  })) as string;

  return { message, signature, walletType: provider };
}

export async function connectPhantom() {
  const phantom = window.phantom?.solana;
  if (!phantom?.isPhantom) {
    throw new Error("Phantom is not installed");
  }

  const response = await phantom.connect();
  return response.publicKey.toString();
}

export async function signSolanaMessage(address: string) {
  const phantom = window.phantom?.solana;
  if (!phantom?.isPhantom) {
    throw new Error("Phantom is not installed");
  }

  const message = buildSignInMessage(address, "solana");
  const encoded = new TextEncoder().encode(message);
  const { signature } = await phantom.signMessage(encoded, "utf8");

  const signatureBase64 = btoa(
    String.fromCharCode(...Array.from(signature)),
  );

  return {
    message,
    signature: signatureBase64,
    walletType: "phantom" as const,
  };
}