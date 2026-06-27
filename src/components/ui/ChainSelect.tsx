"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChainConfig, ChainId, getChain } from "@/lib/wallet/chains";

type ChainSelectProps = {
  value: ChainId;
  onChange: (chain: ChainId) => void;
  chains: ChainId[];
  label?: string;
  disabled?: boolean;
};

function ChainIcon({ chain, size = "md" }: { chain: ChainConfig; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";
  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm",
        dim,
        `bg-gradient-to-br ${chain.gradient}`,
      )}
      style={{ boxShadow: `0 4px 14px ${chain.color}33` }}
    >
      {chain.icon}
    </div>
  );
}

export function ChainSelect({
  value,
  onChange,
  chains,
  label,
  disabled,
}: ChainSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = getChain(value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-600">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition-all duration-200",
          open
            ? "border-blue-300 ring-4 ring-blue-100"
            : "border-slate-200 hover:border-blue-200 hover:shadow-md",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <ChainIcon chain={selected} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{selected.name}</p>
          <p className="text-xs text-slate-500">{selected.symbol}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
          >
            <div className="max-h-72 overflow-y-auto p-1.5">
              {chains.map((id) => {
                const chain = getChain(id);
                const isActive = id === value;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      isActive
                        ? "bg-blue-50"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <ChainIcon chain={chain} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {chain.name}
                      </p>
                      <p className="text-xs text-slate-500">{chain.symbol}</p>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 shrink-0 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}