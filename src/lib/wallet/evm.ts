import { HDNodeWallet, JsonRpcProvider, formatEther } from "ethers";
import { seedFromMnemonic } from "./mnemonic";

const EVM_PATH = "m/44'/60'/0'/0/0";

export function deriveEvmWallet(mnemonic: string) {
  const seed = seedFromMnemonic(mnemonic);
  const hd = HDNodeWallet.fromSeed(seed);
  return hd.derivePath(EVM_PATH);
}

export async function getEvmBalance(address: string, rpcUrl: string) {
  const provider = new JsonRpcProvider(rpcUrl);
  const balance = await provider.getBalance(address);
  return formatEther(balance);
}

export const EVM_CHAINS = {
  ethereum: {
    name: "Ethereum",
    symbol: "ETH",
    rpc: "https://ethereum.publicnode.com",
    chainId: 1,
  },
  polygon: {
    name: "Polygon",
    symbol: "MATIC",
    rpc: "https://polygon-bor.publicnode.com",
    chainId: 137,
  },
  bsc: {
    name: "BNB Chain",
    symbol: "BNB",
    rpc: "https://bsc.publicnode.com",
    chainId: 56,
  },
} as const;

export type EvmChainKey = keyof typeof EVM_CHAINS;