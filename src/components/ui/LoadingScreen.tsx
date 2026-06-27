"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type LoadingScreenProps = {
  message?: string;
  submessage?: string;
  duration?: number;
  onComplete?: () => void;
};

export function LoadingScreen({
  message = "MultiVault",
  submessage = "Initializing secure multi-chain vault",
  duration = 2200,
  onComplete,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    completedRef.current = false;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, (elapsed / duration) * 100));
      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    };

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-base)]/95 backdrop-blur-sm"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface)]">
          <span className="text-xs font-bold tracking-widest text-[var(--primary)]">MV</span>
        </div>

        <motion.h1
          className="mt-8 text-2xl font-semibold tracking-tight text-[var(--foreground)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.h1>

        <motion.p
          className="mt-2 text-sm text-[var(--muted)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          {submessage}
        </motion.p>

        <div className="mt-8 h-1 w-48 overflow-hidden border border-[var(--border)] bg-[var(--surface-solid)]">
          <motion.div
            className="h-full bg-[var(--primary)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}