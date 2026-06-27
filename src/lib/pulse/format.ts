export function formatPulseAge(ms: number) {
  if (ms <= 0) return "—";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

export function addressSlug(mint: string) {
  if (!mint) return "—";
  const suffix = mint.toLowerCase().endsWith("pump")
    ? "_pump"
    : mint.toLowerCase().endsWith("bonk")
      ? "_bonk"
      : "";
  return `${mint.slice(0, 4)}${suffix}`;
}

export function twitterHandle(url?: string | null) {
  if (!url?.trim()) return undefined;
  const match = url.trim().match(/(?:x\.com|twitter\.com)\/(?:#!\/)?(@?)([^/?#]+)/i);
  if (!match) return undefined;
  const handle = match[2];
  if (handle === "i" || handle === "search" || handle === "intent") return undefined;
  return handle.startsWith("@") ? handle.slice(1) : handle;
}

export function solFromLamports(lamports?: number) {
  if (!lamports || lamports <= 0) return 0;
  return lamports / 1e9;
}

export function formatPct(n?: number) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n < 1 && n > 0 ? n.toFixed(1) : Math.round(n)}%`;
}

export function formatCompactMetric(n?: number) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(Math.round(n));
}