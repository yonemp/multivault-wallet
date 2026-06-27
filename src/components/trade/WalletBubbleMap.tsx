"use client";

type WalletBubbleMapProps = {
  symbol: string;
  tokenAddress?: string;
  height?: number;
};

export function WalletBubbleMap({ symbol, tokenAddress, height = 200 }: WalletBubbleMapProps) {
  return (
    <div className="mv-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider">Bubble Map</span>
        <span className="text-[9px] text-[var(--muted)]">{symbol}</span>
      </div>
      <div
        className="flex flex-col items-center justify-center gap-2 bg-[#06060a] px-4 text-center"
        style={{ height }}
      >
        <p className="text-[11px] font-semibold text-[var(--muted)]">Holder bubble map unavailable</p>
        <p className="max-w-xs text-[10px] leading-relaxed text-[var(--muted-dim)]">
          {tokenAddress
            ? "Wallet clustering for this token requires a paid holder API. We do not show simulated bubbles when real money is at stake."
            : "Open a live pair from Pulse to enable holder analytics when an indexer is connected."}
        </p>
      </div>
    </div>
  );
}