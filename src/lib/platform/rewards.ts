import { getLegacyItem } from "@/lib/storage/legacy-keys";

const KEY = "tackers_rewards";

export type RewardsState = {
  points: number;
  rank: string;
  multiplier: number;
  referralCode: string;
  referredBy?: string;
  solEarned: number;
  tradesCount: number;
};

const DEFAULT: RewardsState = {
  points: 0,
  rank: "Bronze",
  multiplier: 1,
  referralCode: "",
  solEarned: 0,
  tradesCount: 0,
};

function generateCode() {
  return `TK${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function loadRewards(): RewardsState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = getLegacyItem(KEY);
    const data = raw ? (JSON.parse(raw) as RewardsState) : { ...DEFAULT };
    if (!data.referralCode) data.referralCode = generateCode();
    return data;
  } catch {
    return { ...DEFAULT, referralCode: generateCode() };
  }
}

export function saveRewards(state: RewardsState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function addTradePoints(amount = 50) {
  const s = loadRewards();
  s.points += amount * s.multiplier;
  s.tradesCount += 1;
  if (s.points >= 10000) s.rank = "Diamond";
  else if (s.points >= 5000) s.rank = "Platinum";
  else if (s.points >= 2000) s.rank = "Gold";
  else if (s.points >= 500) s.rank = "Silver";
  s.solEarned += 0.001 * s.multiplier;
  saveRewards(s);
  return s;
}

export function applyReferral(code: string) {
  const s = loadRewards();
  if (s.referredBy) return s;
  s.referredBy = code;
  s.multiplier = 10;
  saveRewards(s);
  return s;
}