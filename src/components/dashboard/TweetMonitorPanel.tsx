"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TwitterPreviewModal } from "@/components/dashboard/TwitterPreviewModal";

const MOCK_TWEETS = [
  {
    id: "1",
    author: "@solanaalpha",
    handle: "Solana Alpha",
    time: "2m",
    text: "New migration hitting Raydium — volume spiking on $BONK derivatives. Watch liquidity.",
    token: "SOL",
    sentiment: "bullish" as const,
  },
  {
    id: "2",
    author: "@defitrader",
    handle: "DeFi Trader",
    time: "8m",
    text: "Taking profits on memecoin rotation. Next narrative likely AI agents on Solana.",
    token: "SOL",
    sentiment: "neutral" as const,
  },
  {
    id: "3",
    author: "@pumpwatch",
    handle: "Pump Watch",
    time: "14m",
    text: "⚠️ High volatility pair flagged — dev wallet moved 12% supply. Proceed with caution.",
    token: "PEPE",
    sentiment: "bearish" as const,
  },
];

export function TweetMonitorPanel() {
  const [preview, setPreview] = useState<(typeof MOCK_TWEETS)[0] | null>(null);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Tweet Monitor"
        description="Curated alpha from trusted accounts — dev updates and trending narratives"
      />

      <div className="mv-panel flex-1 divide-y divide-[var(--border)] overflow-auto">
        {MOCK_TWEETS.map((tweet) => (
          <button
            key={tweet.id}
            type="button"
            onClick={() => setPreview(tweet)}
            className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-[var(--surface-hover)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--surface-active)] text-[10px] font-bold text-[var(--primary)]">
              X
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold">{tweet.handle}</span>
                <span className="text-[var(--muted)]">{tweet.author}</span>
                <span className="text-[var(--muted-dim)]">· {tweet.time}</span>
                <span
                  className={`ml-auto text-[10px] font-semibold uppercase ${
                    tweet.sentiment === "bullish"
                      ? "text-[var(--gain)]"
                      : tweet.sentiment === "bearish"
                        ? "text-[var(--loss)]"
                        : "text-[var(--muted)]"
                  }`}
                >
                  {tweet.sentiment}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--foreground)]">{tweet.text}</p>
              <span className="mt-1 inline-block text-[10px] font-mono text-[var(--primary)]">
                ${tweet.token}
              </span>
            </div>
          </button>
        ))}
      </div>

      <TwitterPreviewModal tweet={preview} onClose={() => setPreview(null)} />
    </div>
  );
}