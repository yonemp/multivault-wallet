import { Keypair } from "@solana/web3.js";
import { derivePath } from "ed25519-hd-key";
import { seedFromMnemonic } from "./mnemonic";

const SOLANA_PATH = "m/44'/501'/0'/0'";

export function deriveSolanaKeypair(mnemonic: string): Keypair {
  const seed = seedFromMnemonic(mnemonic);
  const { key } = derivePath(SOLANA_PATH, Buffer.from(seed).toString("hex"));
  return Keypair.fromSeed(key.slice(0, 32));
}

export const SOLANA_RPC = "https://api.mainnet-beta.solana.com";