const KEY = "multivault_pulse_col_widths";
export const DEFAULT_PULSE_COL_WIDTHS: [number, number, number] = [33.33, 33.33, 33.34];
export const MIN_PULSE_COL_PCT = 12;

export function loadPulseColumnWidths(): [number, number, number] {
  if (typeof window === "undefined") return DEFAULT_PULSE_COL_WIDTHS;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as number[] | null;
    if (!Array.isArray(raw) || raw.length !== 3) return DEFAULT_PULSE_COL_WIDTHS;
    const sum = raw.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.5) return DEFAULT_PULSE_COL_WIDTHS;
    if (raw.some((w) => w < MIN_PULSE_COL_PCT)) return DEFAULT_PULSE_COL_WIDTHS;
    return [raw[0], raw[1], raw[2]];
  } catch {
    return DEFAULT_PULSE_COL_WIDTHS;
  }
}

export function savePulseColumnWidths(widths: [number, number, number]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(widths));
}

export function clampPair(
  left: number,
  right: number,
  min = MIN_PULSE_COL_PCT,
): [number, number] {
  let l = left;
  let r = right;
  if (l < min) {
    r -= min - l;
    l = min;
  }
  if (r < min) {
    l -= min - r;
    r = min;
  }
  return [l, r];
}