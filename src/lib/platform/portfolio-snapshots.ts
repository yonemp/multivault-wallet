const KEY = "mv_portfolio_snapshots";

export type PortfolioSnapshot = {
  date: string;
  usd: number;
};

export function loadSnapshots(): PortfolioSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as PortfolioSnapshot[];
  } catch {
    return [];
  }
}

export function recordSnapshot(usd: number) {
  const today = new Date().toISOString().slice(0, 10);
  const snaps = loadSnapshots().filter((s) => s.date !== today);
  snaps.push({ date: today, usd });
  snaps.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(KEY, JSON.stringify(snaps.slice(-120)));
}

export function getDailyPnl(): Record<string, number> {
  const snaps = loadSnapshots();
  const pnl: Record<string, number> = {};
  for (let i = 1; i < snaps.length; i++) {
    pnl[snaps[i].date] = snaps[i].usd - snaps[i - 1].usd;
  }
  return pnl;
}

export function getMonthPnl(year: number, month: number): { day: number; pnl: number }[] {
  const daily = getDailyPnl();
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return Object.entries(daily)
    .filter(([d]) => d.startsWith(prefix))
    .map(([d, pnl]) => ({ day: parseInt(d.slice(8), 10), pnl }));
}