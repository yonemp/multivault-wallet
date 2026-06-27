"use client";

import { useCallback, useState } from "react";

type PendingAction = {
  title: string;
  description: string;
  confirmLabel?: string;
  action: (password: string) => Promise<void>;
};

export function usePasswordPrompt() {
  const [pending, setPending] = useState<PendingAction | null>(null);

  const requestPassword = useCallback((opts: PendingAction) => {
    setPending(opts);
  }, []);

  const close = useCallback(() => setPending(null), []);

  const confirm = useCallback(
    async (password: string) => {
      if (!pending) return;
      await pending.action(password);
      setPending(null);
    },
    [pending],
  );

  return {
    open: Boolean(pending),
    title: pending?.title ?? "",
    description: pending?.description ?? "",
    confirmLabel: pending?.confirmLabel,
    requestPassword,
    close,
    confirm,
  };
}