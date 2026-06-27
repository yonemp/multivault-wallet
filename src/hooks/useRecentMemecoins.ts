"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadRecentMemecoins,
  RECENT_MEMECOINS_EVENT,
  removeRecentMemecoin,
  type RecentMemecoin,
} from "@/lib/platform/recent-memecoins";

export function useRecentMemecoins() {
  const [recent, setRecent] = useState<RecentMemecoin[]>([]);

  const refresh = useCallback(() => {
    setRecent(loadRecentMemecoins());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(RECENT_MEMECOINS_EVENT, refresh);
    return () => window.removeEventListener(RECENT_MEMECOINS_EVENT, refresh);
  }, [refresh]);

  const remove = useCallback(
    (assetId: string) => {
      removeRecentMemecoin(assetId);
      refresh();
    },
    [refresh],
  );

  return { recent, remove, refresh };
}