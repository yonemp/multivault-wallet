"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type TokenOption = {
  id: string;
  label: string;
  sublabel?: string;
};

type TokenSelectProps = {
  value: string;
  onChange: (id: string) => void;
  options: TokenOption[];
  label?: string;
};

export function TokenSelect({ value, onChange, options, label }: TokenSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) ?? options[0];

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
        data-open={open}
        onClick={() => setOpen((o) => !o)}
        className="mv-dropdown-trigger"
      >
        <span className="flex h-7 w-7 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-solid)] text-[10px] font-bold text-[var(--primary)]">
          {selected?.label.slice(0, 3)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--foreground)]">{selected?.label}</p>
          {selected?.sublabel && (
            <p className="text-[11px] text-[var(--muted)]">{selected.sublabel}</p>
          )}
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
            <div className="p-1">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={clsx(
                    "flex w-full items-center justify-between px-2.5 py-2 text-left text-sm",
                    opt.id === value
                      ? "bg-[var(--primary-soft)] font-medium text-[var(--primary)]"
                      : "text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.6)]",
                  )}
                >
                  <span>{opt.label}</span>
                  {opt.id === value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}