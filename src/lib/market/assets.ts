import { ChainId } from "@/lib/wallet/chains";

export type MarketAsset = {
  id: string;
  symbol: string;
  name: string;
  chainId?: ChainId;
  coingeckoId?: string;
  color: string;
  tradable: boolean;
};

export const MARKET_ASSETS: MarketAsset[] = [
  { id: "btc", symbol: "BTC", name: "Bitcoin", chainId: "bitcoin", coingeckoId: "bitcoin", color: "#F7931A", tradable: true },
  { id: "ltc", symbol: "LTC", name: "Litecoin", chainId: "litecoin", coingeckoId: "litecoin", color: "#345D9D", tradable: true },
  { id: "eth", symbol: "ETH", name: "Ethereum", chainId: "ethereum", coingeckoId: "ethereum", color: "#627EEA", tradable: true },
  { id: "sol", symbol: "SOL", name: "Solana", chainId: "solana", coingeckoId: "solana", color: "#9945FF", tradable: true },
  { id: "bnb", symbol: "BNB", name: "BNB Chain", chainId: "ethereum", coingeckoId: "binancecoin", color: "#F0B90B", tradable: true },
  { id: "usdc", symbol: "USDC", name: "USD Coin", coingeckoId: "usd-coin", color: "#2775CA", tradable: true },
  { id: "ton", symbol: "TON", name: "TON", chainId: "ton", coingeckoId: "the-open-network", color: "#0098EA", tradable: true },
  { id: "xrp", symbol: "XRP", name: "XRP", chainId: "xrp", coingeckoId: "ripple", color: "#23292F", tradable: true },
];

export function getMarketAsset(id: string) {
  return MARKET_ASSETS.find((a) => a.id === id);
}

export function getMarketAssetByChain(chainId: ChainId) {
  return MARKET_ASSETS.find((a) => a.chainId === chainId);
}