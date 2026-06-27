"use client";

import { useMemo } from "react";
import {
  BUBBLE_COLORS,
  buildWalletBubbles,
  WalletBubble,
} from "@/lib/platform/mock-trade-data";

type WalletBubbleMapProps = {
  symbol: string;
  height?: number;
};

function Bubble({ b }: { b: WalletBubble }) {
  const size = Math.max(18, Math.min(56, b.pct * 4));
  const color = BUBBLE_COLORS[b.type];

  return (
    <div
      className="absolute flex items-center justify-center rounded-full border-2 font-mono text-[7px] font-bold transition-transform hover:scale-110 hover:z-10"
      style={{
        left: `${b.x}%`,
        top: `${b.y}%`,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderColor: color,
        backgroundColor: `${color}22`,
        color,
        boxShadow: `0 0 12px ${color}44`,
      }}
      title={`${b.label} · ${b.pct.toFixed(1)}% · ${b.type}`}
    >
      {b.pct > 4 ? `${b.pct.toFixed(0)}%` : ""}
    </div>
  );
}

export function WalletBubbleMap({ symbol, height = 200 }: WalletBubbleMapProps) {
  const bubbles = useMemo(() => buildWalletBubbles(symbol), [symbol]);

  const legend = [
    { type: "dev" as const, label: "Dev" },
    { type: "sniper" as const, label: "Sniper" },
    { type: "insider" as const, label: "Insider" },
    { type: "bundler" as const, label: "Bundler" },
    { type: "new" as const, label: "New" },
    { type: "whale" as const, label: "Whale" },
  ];

  return (
    <div className="mv-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider">Bubble Map</span>
        <span className="text-[9px] text-[var(--muted)]">{bubbles.length} wallets</span>
      </div>
      <div className="relative bg-[#06060a]" style={{ height }}>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle at 50% 50%, rgba(91,122,255,0.15) 0%, transparent 70%)",
          }}
        />
        {bubbles.map((b) => (
          <Bubble key={b.id} b={b} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] px-3 py-2">
        {legend.map(({ type, label }) => (
          <span key={type} className="flex items-center gap-1 text-[8px] text-[var(--muted)]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BUBBLE_COLORS[type] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}