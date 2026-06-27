"use client";

import { Panel } from "@/components/ui/Panel";
import { X } from "lucide-react";

type Tweet = {
  author: string;
  handle: string;
  time: string;
  text: string;
  token: string;
  sentiment: string;
};

type TwitterPreviewModalProps = {
  tweet: Tweet | null;
  onClose: () => void;
};

export function TwitterPreviewModal({ tweet, onClose }: TwitterPreviewModalProps) {
  if (!tweet) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <Panel className="relative w-full max-w-md p-5">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 text-[var(--muted)]">
          <X className="h-4 w-4" />
        </button>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]">
          Twitter preview
        </p>
        <p className="mt-2 font-semibold">{tweet.handle}</p>
        <p className="text-xs text-[var(--muted)]">{tweet.author} · {tweet.time} ago</p>
        <p className="mt-4 text-sm leading-relaxed">{tweet.text}</p>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Related token: <span className="font-mono text-[var(--primary)]">${tweet.token}</span>
        </p>
      </Panel>
    </div>
  );
}