export type WalletBubble = {
  id: string;
  label: string;
  pct: number;
  type: "dev" | "whale" | "sniper" | "insider" | "bundler" | "new" | "holder";
  x: number;
  y: number;
};

export type LiveTrade = {
  id: string;
  side: "buy" | "sell";
  wallet: string;
  amountSol: number;
  amountUsd: number;
  time: string;
  tag?: "sniper" | "insider" | "dev" | "bundler";
};

const WALLET_TYPES: WalletBubble["type"][] = [
  "dev", "whale", "sniper", "insider", "bundler", "new", "holder",
];

function seeded(seed: number) {
  const x = Math.sin(seed * 4321) * 10000;
  return x - Math.floor(x);
}

export function buildWalletBubbles(tokenSymbol: string): WalletBubble[] {
  const count = 18 + (tokenSymbol.length % 8);
  return Array.from({ length: count }, (_, i) => {
    const s = seeded(i + tokenSymbol.charCodeAt(0));
    const s2 = seeded(i * 7);
    const pct = 0.3 + s * 12;
    return {
      id: `w-${i}`,
      label: `${tokenSymbol.slice(0, 2)}${Math.floor(s2 * 9999)}`,
      pct,
      type: WALLET_TYPES[i % WALLET_TYPES.length],
      x: 8 + s * 84,
      y: 8 + s2 * 84,
    };
  });
}

export function buildLiveTrade(seed: number): LiveTrade {
  const s = seeded(seed);
  const side = s > 0.42 ? "buy" : "sell";
  const amountSol = +(0.1 + s * 8).toFixed(2);
  const tags: LiveTrade["tag"][] = ["sniper", "insider", "dev", "bundler"];
  const tag = s > 0.75 ? tags[Math.floor(s * 4) % 4] : undefined;
  return {
    id: `t-${Date.now()}-${seed}`,
    side,
    wallet: `${["8xKm", "3nQw", "7pRt", "2bVc", "9kLm"][seed % 5]}…${Math.floor(s * 999)}`,
    amountSol,
    amountUsd: Math.round(amountSol * 140 * 100) / 100,
    time: "just now",
    tag,
  };
}

export const BUBBLE_COLORS: Record<WalletBubble["type"], string> = {
  dev: "#f5a623",
  whale: "#5b7aff",
  sniper: "#ff5c7a",
  insider: "#9945FF",
  bundler: "#00d68a",
  new: "#7b94ff",
  holder: "#5c5c6e",
};