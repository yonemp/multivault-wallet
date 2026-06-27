"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type PnlCalendarModalProps = {
  open: boolean;
  onClose: () => void;
};

function seeded(seed: number) {
  const x = Math.sin(seed * 7777) * 10000;
  return x - Math.floor(x);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PnlCalendarModal({ open, onClose }: PnlCalendarModalProps) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);

  const days = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const cells: ({ day: number; pnl: number } | null)[] = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      const s = seeded(year * 100 + month * 31 + d);
      const pnl = (s - 0.42) * 800;
      cells.push({ day: d, pnl });
    }
    return cells;
  }, [year, month]);

  const monthPnl = days.reduce((sum, c) => sum + (c?.pnl ?? 0), 0);
  const wins = days.filter((c) => c && c.pnl > 0).length;
  const losses = days.filter((c) => c && c.pnl < 0).length;

  if (!open) return null;

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const monthLabel = new Date(year, month).toLocaleString("en", { month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="mv-panel w-full max-w-md shadow-[var(--shadow-xl)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold">PNL Calendar</p>
            <p className="text-[10px] text-[var(--muted)]">Daily realized PNL</p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="p-1 text-[var(--muted)] hover:text-[var(--foreground)]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">{monthLabel}</span>
            <button type="button" onClick={nextMonth} className="p-1 text-[var(--muted)] hover:text-[var(--foreground)]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-2 flex h-2 overflow-hidden rounded-sm">
            <div className="bg-[var(--gain)]" style={{ width: `${(wins / (wins + losses || 1)) * 100}%` }} />
            <div className="bg-[var(--loss)]" style={{ width: `${(losses / (wins + losses || 1)) * 100}%` }} />
          </div>

          <div className="mb-1 flex justify-between text-[9px] text-[var(--muted)]">
            <span className="text-[var(--gain)]">{wins} green days</span>
            <span className={monthPnl >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}>
              {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(0)} month
            </span>
            <span className="text-[var(--loss)]">{losses} red days</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[9px]">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1 font-semibold text-[var(--muted-dim)]">{d}</div>
            ))}
            {days.map((cell, i) =>
              cell ? (
                <div
                  key={i}
                  className={`rounded py-1.5 font-mono ${
                    cell.pnl >= 0
                      ? "bg-[var(--gain-soft)] text-[var(--gain)]"
                      : "bg-[var(--loss-soft)] text-[var(--loss)]"
                  }`}
                  title={`$${cell.pnl.toFixed(0)}`}
                >
                  {cell.day}
                </div>
              ) : (
                <div key={i} />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}