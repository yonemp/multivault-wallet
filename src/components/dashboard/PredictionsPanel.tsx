"use client";

const MARKETS = [
  { q: "SOL above $200 by July?", yes: 62 },
  { q: "BTC new ATH in 2026?", yes: 48 },
  { q: "Fed rate cut in Q3?", yes: 71 },
];

export function PredictionsPanel() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <h1 className="text-base font-semibold">Predictions</h1>
        <p className="text-[11px] text-[var(--muted)]">Event markets — Axiom-style prediction terminal</p>
      </div>
      <div className="mv-panel divide-y divide-[var(--border)]">
        {MARKETS.map((m) => (
          <div key={m.q} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm">{m.q}</span>
            <div className="flex gap-2">
              <button type="button" className="bg-[var(--gain-soft)] px-3 py-1 text-[10px] font-bold text-[var(--gain)]">
                Yes {m.yes}¢
              </button>
              <button type="button" className="bg-[var(--loss-soft)] px-3 py-1 text-[10px] font-bold text-[var(--loss)]">
                No {100 - m.yes}¢
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}