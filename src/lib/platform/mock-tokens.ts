export type PulseColumn = "new" | "final" | "migrated";

export type Protocol = "pump.fun" | "raydium" | "meteora" | "moonshot";

export type MemeToken = {
  id: string;
  symbol: string;
  name: string;
  mcap: number;
  liquidity: number;
  volume: number;
  age: string;
  txCount: number;
  holders: number;
  change5m: number;
  column: PulseColumn;
  quickBuySol: number;
  protocol: Protocol;
  devHolding: number;
  bundlers: number;
  snipers: number;
  insiders: number;
  newWallets: number;
};

const MEME_NAMES = [
  { symbol: "BONK", name: "Bonk Inu" },
  { symbol: "WIF", name: "dogwifhat" },
  { symbol: "POPCAT", name: "Popcat" },
  { symbol: "MEW", name: "cat in a dogs world" },
  { symbol: "BOME", name: "BOOK OF MEME" },
  { symbol: "SLERF", name: "Slerf" },
  { symbol: "MYRO", name: "Myro" },
  { symbol: "GIGA", name: "Gigachad" },
  { symbol: "MOG", name: "Mog Coin" },
  { symbol: "PONKE", name: "Ponke" },
  { symbol: "FWOG", name: "Fwog" },
  { symbol: "RETARDIO", name: "Retardio" },
  { symbol: "SIGMA", name: "Sigma" },
  { symbol: "HARAMBE", name: "Harambe" },
  { symbol: "CHILLGUY", name: "Just a chill guy" },
  { symbol: "GOAT", name: "Goatseus Maximus" },
  { symbol: "PNUT", name: "Peanut the Squirrel" },
  { symbol: "FARTCOIN", name: "Fartcoin" },
];

const PROTOCOLS: Protocol[] = ["pump.fun", "raydium", "meteora", "moonshot"];
const AGES = ["2s", "5s", "12s", "30s", "1m", "2m", "5m", "8m", "12m", "18m", "25m", "45m", "1h", "2h"];
const COLUMNS: PulseColumn[] = ["new", "final", "migrated"];

function seeded(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export function buildMemeTokens(_solPrice: number): MemeToken[] {
  return MEME_NAMES.map((m, i) => {
    const s = seeded(i + 1);
    const s2 = seeded(i + 42);
    const s3 = seeded(i + 99);
    const mcap = Math.round((8_000 + s * 2_500_000) * (i % 3 === 2 ? 3 : 1));
    const liquidity = Math.round(mcap * (0.04 + s2 * 0.12));
    const volume = Math.round(mcap * (0.1 + s3 * 0.4));
    const column = COLUMNS[i % 3];
    const change5m = (s3 - 0.45) * 80;
    return {
      id: `meme-${m.symbol.toLowerCase()}`,
      symbol: m.symbol,
      name: m.name,
      mcap,
      liquidity,
      volume,
      age: AGES[i % AGES.length],
      txCount: Math.floor(20 + s * 800),
      holders: Math.floor(15 + s2 * 1200),
      change5m,
      column,
      quickBuySol: 0.5,
      protocol: PROTOCOLS[i % PROTOCOLS.length],
      devHolding: Math.round((2 + s * 18) * 10) / 10,
      bundlers: Math.floor(s2 * 12),
      snipers: Math.floor(s3 * 25),
      insiders: Math.floor(s * 8),
      newWallets: Math.floor(5 + s2 * 40),
    };
  });
}

export function formatCompactUsd(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatCompactSol(usd: number, solPrice: number) {
  const sol = usd / solPrice;
  if (sol >= 1000) return `${(sol / 1000).toFixed(1)}K`;
  return sol.toFixed(2);
}

export const PULSE_FILTER_LABELS = {
  protocol: "Protocol",
  mcap: "MC",
  volume: "Vol",
  devHolding: "Dev holding",
  bundlers: "Bundlers",
  snipers: "Snipers",
  insiders: "Insiders",
  newWallets: "New wallets",
} as const;