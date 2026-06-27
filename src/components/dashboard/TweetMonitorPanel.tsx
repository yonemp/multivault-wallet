"use client";

import { PageHeader } from "@/components/ui/PageHeader";

export function TweetMonitorPanel() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Tweet Monitor"
        description="Live alpha from trusted accounts — requires Twitter/X API integration"
      />

      <div className="mv-panel flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-sm font-semibold text-[var(--muted)]">No live tweet feed connected</p>
        <p className="max-w-md text-xs leading-relaxed text-[var(--muted-dim)]">
          Tweet monitoring needs a configured X API subscription. We do not display simulated posts when real trading decisions are involved.
        </p>
      </div>
    </div>
  );
}