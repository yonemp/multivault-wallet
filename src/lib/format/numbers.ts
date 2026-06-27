export function safeNumber(n: unknown, fallback = 0): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

export function safeFixed(n: unknown, digits = 2, fallback = "—"): string {
  const v = safeNumber(n, NaN);
  return Number.isFinite(v) ? v.toFixed(digits) : fallback;
}

export function formatCompactUsd(n: unknown) {
  const v = safeNumber(n);
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

export function formatCompactSol(usd: unknown, solPrice: unknown) {
  const usdN = safeNumber(usd);
  const solP = safeNumber(solPrice, 1);
  const sol = usdN / solP;
  if (sol >= 1000) return `${(sol / 1000).toFixed(1)}K`;
  return sol.toFixed(2);
}