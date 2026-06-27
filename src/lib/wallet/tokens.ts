import { EvmChainKey } from "./evm";

export const NATIVE_TOKEN = "native";

export const EVM_TOKENS: Record<
  EvmChainKey,
  { symbol: string; native: string; usdc: string; decimals: { native: number; usdc: number } }
> = {
  ethereum: {
    symbol: "ETH",
    native: "0x0000000000000000000000000000000000000000",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: { native: 18, usdc: 6 },
  },
  polygon: {
    symbol: "MATIC",
    native: "0x0000000000000000000000000000000000000000",
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: { native: 18, usdc: 6 },
  },
  bsc: {
    symbol: "BNB",
    native: "0x0000000000000000000000000000000000000000",
    usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: { native: 18, usdc: 18 },
  },
};

export const SOLANA_TOKENS = {
  sol: {
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
  },
  usdc: {
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
  },
} as const;

export type EvmTokenId = "native" | "usdc";
export type SolanaTokenId = "sol" | "usdc";