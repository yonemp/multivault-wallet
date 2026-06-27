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
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-600">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex w-full items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition-all",
          open
            ? "border-blue-300 ring-4 ring-blue-100"
            : "border-slate-200 hover:border-blue-200",
        )}
      >
        <div>
          <p className="text-sm font-semibold text-slate-900">{selected?.label}</p>
          {selected?.sublabel && (
            <p className="text-xs text-slate-500">{selected.sublabel}</p>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                  opt.id === value ? "bg-blue-50 font-semibold text-blue-700" : "hover:bg-slate-50",
                )}
              >
                {opt.label}
                {opt.id === value && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}