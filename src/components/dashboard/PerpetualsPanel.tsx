"use client";

export function PerpetualsPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-lg font-semibold">Perpetuals</p>
      <p className="max-w-md text-sm text-[var(--muted)]">
        Leveraged perpetual futures terminal — matching Axiom layout. Connect funding and margin in a future release.
      </p>
      <div className="mv-panel grid w-full max-w-2xl grid-cols-3 gap-px bg-[var(--border)]">
        {["BTC-PERP", "ETH-PERP", "SOL-PERP"].map((p) => (
          <div key={p} className="bg-[var(--surface)] px-4 py-6">
            <p className="font-mono text-sm font-semibold">{p}</p>
            <p className="mt-1 text-[10px] text-[var(--muted)]">Coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}