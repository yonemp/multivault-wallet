"use client";

import { useRecentMemecoins } from "@/hooks/useRecentMemecoins";
import { Trash2 } from "lucide-react";

type RecentMemecoinsBarProps = {
  onSelect?: (assetId: string) => void;
};

export function RecentMemecoinsBar({ onSelect }: RecentMemecoinsBarProps) {
  const { recent, remove } = useRecentMemecoins();

  if (!recent.length) return null;

  return (
    <div className="mv-recent-memecoins" role="list" aria-label="Recently viewed memecoins">
      {recent.map((coin) => (
        <div key={coin.assetId} className="mv-recent-coin-pill" role="listitem">
          <button
            type="button"
            className="mv-recent-coin-ticker"
            onClick={() => onSelect?.(coin.assetId)}
            title={coin.name ? `${coin.symbol} — ${coin.name}` : coin.symbol}
          >
            {coin.imageUri ? (
              <img src={coin.imageUri} alt="" className="mv-recent-coin-img" />
            ) : (
              <span className="mv-recent-coin-fallback">{coin.symbol.slice(0, 1)}</span>
            )}
            <span className="mv-recent-coin-symbol">{coin.symbol}</span>
          </button>
          <button
            type="button"
            className="mv-recent-coin-remove"
            onClick={() => remove(coin.assetId)}
            aria-label={`Remove ${coin.symbol} from recent history`}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}