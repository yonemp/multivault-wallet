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