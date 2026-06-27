"use client";

import { useMemo, useState } from "react";
import { getMonthPnl, loadSnapshots } from "@/lib/platform/portfolio-snapshots";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type PnlCalendarModalProps = {
  open: boolean;
  onClose: () => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PnlCalendarModal({ open, onClose }: PnlCalendarModalProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const monthData = useMemo(() => getMonthPnl(year, month), [year, month]);
  const pnlByDay = useMemo(() => new Map(monthData.map((d) => [d.day, d.pnl])), [monthData]);

  const days = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const cells: ({ day: number; pnl: number | null } | null)[] = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      cells.push({ day: d, pnl: pnlByDay.get(d) ?? null });
    }
    return cells;
  }, [year, month, pnlByDay]);

  const monthPnl = monthData.reduce((sum, c) => sum + c.pnl, 0);
  const wins = monthData.filter((c) => c.pnl > 0).length;
  const losses = monthData.filter((c) => c.pnl < 0).length;
  const hasData = loadSnapshots().length > 1;

  if (!open) return null;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  }

  const monthLabel = new Date(year, month).toLocaleString("en", { month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="mv-panel w-full max-w-md shadow-[var(--shadow-xl)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold">PNL Calendar</p>
            <p className="text-[10px] text-[var(--muted)]">Daily portfolio value change (recorded on visit)</p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3">
          {!hasData && (
            <p className="mb-3 text-[10px] text-[var(--muted)]">
              Visit Portfolio daily to build real snapshot history. No fabricated data is shown.
            </p>
          )}

          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="p-1 text-[var(--muted)]"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-semibold">{monthLabel}</span>
            <button type="button" onClick={nextMonth} className="p-1 text-[var(--muted)]"><ChevronRight className="h-4 w-4" /></button>
          </div>

          {monthData.length > 0 && (
            <>
              <div className="mb-2 flex h-2 overflow-hidden rounded-sm">
                <div className="bg-[var(--gain)]" style={{ width: `${(wins / (wins + losses || 1)) * 100}%` }} />
                <div className="bg-[var(--loss)]" style={{ width: `${(losses / (wins + losses || 1)) * 100}%` }} />
              </div>
              <div className="mb-1 flex justify-between text-[9px] text-[var(--muted)]">
                <span className="text-[var(--gain)]">{wins} green</span>
                <span className={monthPnl >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}>
                  {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)} month
                </span>
                <span className="text-[var(--loss)]">{losses} red</span>
              </div>
            </>
          )}

          <div className="grid grid-cols-7 gap-1 text-center text-[9px]">
            {WEEKDAYS.map((d) => <div key={d} className="py-1 font-semibold text-[var(--muted-dim)]">{d}</div>)}
            {days.map((cell, i) =>
              cell ? (
                <div
                  key={i}
                  className={`rounded py-1.5 font-mono ${
                    cell.pnl === null
                      ? "text-[var(--muted-dim)]"
                      : cell.pnl >= 0
                        ? "bg-[var(--gain-soft)] text-[var(--gain)]"
                        : "bg-[var(--loss-soft)] text-[var(--loss)]"
                  }`}
                  title={cell.pnl !== null ? `$${cell.pnl.toFixed(2)}` : "No snapshot"}
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