"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";

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

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const next = Math.min(100, (elapsed / duration) * 100);
      setProgress(next);
      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };
    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/80 to-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: "1200px" }}
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-sky-300/25 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-300/15 blur-2xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6">
        <motion.div
          className="relative"
          initial={{ scale: 0.6, opacity: 0, rotateX: 25 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.div
            className="absolute inset-0 rounded-3xl bg-blue-500/30 blur-2xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-2xl shadow-blue-500/40">
            <Wallet className="h-9 w-9" />
          </div>
        </motion.div>

        <motion.h1
          className="mt-10 text-4xl font-bold tracking-tight text-slate-900"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {message.split("").map((char, i) => (
            <motion.span
              key={`${char}-${i}`}
              className="inline-block"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.04, duration: 0.5 }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className="mt-3 max-w-sm text-center text-sm text-slate-500"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          {submessage}
        </motion.p>

        <motion.div
          className="mt-10 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200/80"
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600"
            style={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
          />
        </motion.div>

        <motion.div
          className="mt-6 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {["BTC", "ETH", "SOL", "TON", "XRP"].map((sym, i) => (
            <motion.span
              key={sym}
              className="rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm"
              animate={{ y: [0, -4, 0] }}
              transition={{
                delay: i * 0.15,
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {sym}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}