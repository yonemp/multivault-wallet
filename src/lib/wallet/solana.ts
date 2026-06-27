import { Keypair } from "@solana/web3.js";
import { derivePath } from "ed25519-hd-key";
import { seedFromMnemonic } from "./mnemonic";

const SOLANA_PATH = "m/44'/501'/0'/0'";

export function deriveSolanaKeypair(mnemonic: string): Keypair {
  const seed = seedFromMnemonic(mnemonic);
  const { key } = derivePath(SOLANA_PATH, Buffer.from(seed).toString("hex"));
  return Keypair.fromSeed(key.slice(0, 32));
}

const DEFAULT_SOLANA_RPCS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-rpc.publicnode.com",
  "https://solana.drpc.org",
];

export function getSolanaRpcEndpoints(): string[] {
  const custom = process.env.SOLANA_RPC_URL?.trim();
  if (custom) {
    return [custom, ...DEFAULT_SOLANA_RPCS.filter((rpc) => rpc !== custom)];
  }
  return DEFAULT_SOLANA_RPCS;
}

export const SOLANA_RPC = DEFAULT_SOLANA_RPCS[0];