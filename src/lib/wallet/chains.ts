export type ChainId =
  | "bitcoin"
  | "litecoin"
  | "ethereum"
  | "solana"
  | "ton"
  | "monero"
  | "xrp";

export type ChainFamily = "utxo" | "evm" | "solana" | "ton" | "monero" | "xrp";

export type ChainConfig = {
  id: ChainId;
  name: string;
  symbol: string;
  color: string;
  gradient: string;
  icon: string;
  family: ChainFamily;
  canSend: boolean;
  canSwap: boolean;
  decimals: number;
};

export const CHAINS: Record<ChainId, ChainConfig> = {
  bitcoin: {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    color: "#F7931A",
    gradient: "from-orange-400 to-amber-500",
    icon: "₿",
    family: "utxo",
    canSend: true,
    canSwap: false,
    decimals: 8,
  },
  litecoin: {
    id: "litecoin",
    name: "Litecoin",
    symbol: "LTC",
    color: "#345D9D",
    gradient: "from-slate-400 to-blue-600",
    icon: "Ł",
    family: "utxo",
    canSend: true,
    canSwap: false,
    decimals: 8,
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    color: "#627EEA",
    gradient: "from-indigo-400 to-blue-600",
    icon: "Ξ",
    family: "evm",
    canSend: true,
    canSwap: true,
    decimals: 18,
  },
  solana: {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    color: "#9945FF",
    gradient: "from-fuchsia-400 to-purple-600",
    icon: "◎",
    family: "solana",
    canSend: true,
    canSwap: true,
    decimals: 9,
  },
  ton: {
    id: "ton",
    name: "TON",
    symbol: "TON",
    color: "#0098EA",
    gradient: "from-sky-400 to-blue-500",
    icon: "💎",
    family: "ton",
    canSend: true,
    canSwap: false,
    decimals: 9,
  },
  monero: {
    id: "monero",
    name: "Monero",
    symbol: "XMR",
    color: "#FF6600",
    gradient: "from-orange-500 to-red-600",
    icon: "ɱ",
    family: "monero",
    canSend: false,
    canSwap: false,
    decimals: 12,
  },
  xrp: {
    id: "xrp",
    name: "XRP",
    symbol: "XRP",
    color: "#23292F",
    gradient: "from-slate-600 to-slate-800",
    icon: "✕",
    family: "xrp",
    canSend: true,
    canSwap: false,
    decimals: 6,
  },
};

export const CHAIN_LIST = Object.values(CHAINS);

export function getChain(id: ChainId) {
  return CHAINS[id];
}