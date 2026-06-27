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

function ChainBadge({ chain, size = "md" }: { chain: ChainConfig; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-[11px]";
  return (
    <span
      className={clsx(
        "flex shrink-0 items-center justify-center border font-semibold",
        dim,
      )}
      style={{
        borderColor: chain.color,
        color: chain.color,
        backgroundColor: `${chain.color}14`,
      }}
    >
      {chain.symbol.slice(0, 3)}
    </span>
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
      {label && <label className="mv-label">{label}</label>}

      <button
        type="button"
        disabled={disabled}
        data-open={open}
        onClick={() => setOpen((o) => !o)}
        className="mv-dropdown-trigger"
      >
        <ChainBadge chain={selected} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--foreground)]">{selected.name}</p>
          <p className="text-[11px] text-[var(--muted)]">{selected.symbol}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="mv-dropdown-menu"
          >
            <div className="max-h-72 overflow-y-auto p-1">
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
                      "flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors",
                      isActive
                        ? "bg-[var(--primary-soft)]"
                        : "hover:bg-[rgba(255,255,255,0.6)]",
                    )}
                  >
                    <ChainBadge chain={chain} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {chain.name}
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">{chain.symbol}</p>
                    </div>
                    {isActive && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
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