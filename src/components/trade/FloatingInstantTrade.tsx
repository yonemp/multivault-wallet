"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Settings, X } from "lucide-react";
import { addTradePoints } from "@/lib/platform/rewards";
import { getLegacyItem } from "@/lib/storage/legacy-keys";

type FloatingInstantTradeProps = {
  symbol: string;
  onClose?: () => void;
  onTrade?: (side: "buy" | "sell", amount: string) => void;
};

const BUY_AMOUNTS = [0.5, 2, 5, 10];
const SELL_PCTS = [10, 25, 50, 100];
const PAY_TOKENS = ["SOL", "USDC", "USOL"] as const;

const POS_KEY = "tackers_instant_trade_pos";

export function FloatingInstantTrade({ symbol, onClose, onTrade }: FloatingInstantTradeProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const [pos, setPos] = useState({ x: 0, y: 80 });
  const [preset, setPreset] = useState<"P1" | "P2" | "P3">("P1");
  const [payToken, setPayToken] = useState<(typeof PAY_TOKENS)[number]>("SOL");
  const [slippage] = useState(7);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = getLegacyItem(POS_KEY);
      if (saved) setPos(JSON.parse(saved) as { x: number; y: number });
      else setPos({ x: Math.max(0, window.innerWidth - 300), y: 100 });
    } catch {
      setPos({ x: Math.max(0, window.innerWidth - 300), y: 100 });
    }
  }, []);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, label")) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const next = {
        x: Math.max(0, Math.min(window.innerWidth - 260, dragRef.current.origX + dx)),
        y: Math.max(48, Math.min(window.innerHeight - 320, dragRef.current.origY + dy)),
      };
      setPos(next);
    }
    function onUp() {
      if (dragRef.current) {
        dragRef.current = null;
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
  }, [pos]);

  function handleBuy(amount: number) {
    addTradePoints(25);
    setNote(`Buy ${amount} ${payToken} â†’ ${symbol}`);
    onTrade?.("buy", String(amount));
  }

  function handleSell(pct: number) {
    addTradePoints(25);
    setNote(`Sell ${pct}% ${symbol}`);
    onTrade?.("sell", String(pct));
  }

  return (
    <div
      ref={panelRef}
      className="ax-instant-trade fixed z-[80] w-[248px] select-none shadow-[var(--shadow-xl)]"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={onDragStart}
    >
      {/* Header */}
      <div className="flex cursor-grab items-center gap-1 border-b border-[var(--border)] bg-[#0a0a0e] px-2 py-1.5 active:cursor-grabbing">
        {(["P1", "P2", "P3"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
              preset === p ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[var(--muted-dim)]"
            }`}
          >
            {p}
          </button>
        ))}
        <button type="button" className="ml-0.5 p-0.5 text-[var(--muted)] hover:text-[var(--foreground)]">
          <Settings className="h-3 w-3" />
        </button>
        <span className="ml-auto rounded border border-[var(--border)] px-1.5 py-0.5 text-[9px] font-mono text-[var(--muted)]">1</span>
        {onClose && (
          <button type="button" onClick={onClose} className="p-0.5 text-[var(--muted)] hover:text-[var(--loss)]">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="border border-[var(--border)] border-t-0 bg-[#08080c]">
        {/* Buy */}
        <div className="border-b border-[var(--border)] p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--foreground)]">Buy</span>
            <span className="font-mono text-[10px] text-[var(--muted)]">0</span>
          </div>
          <div className="mb-2 flex gap-1">
            {PAY_TOKENS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPayToken(t)}
                className={`flex-1 rounded-full border py-0.5 text-[9px] font-bold ${
                  payToken === t
                    ? "border-[var(--gain)] bg-[var(--gain-soft)] text-[var(--gain)]"
                    : "border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {BUY_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleBuy(amt)}
                className="rounded-full border border-[var(--gain)] py-1.5 text-[10px] font-bold text-[var(--gain)] transition hover:bg-[var(--gain-soft)]"
              >
                {amt}
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[8px] text-[var(--muted)]">
            <span className="font-bold text-[var(--gain)]">{slippage}%</span>
            <span>0.0</span>
            <span>0.1 â–²</span>
            <span>0.01</span>
            <span className="rounded border border-[var(--border)] px-1">Off</span>
            <label className="flex items-center gap-0.5">
              <input type="checkbox" className="h-2.5 w-2.5 accent-[var(--primary)]" />
              Adv.
            </label>
          </div>
        </div>

        {/* Sell */}
        <div className="p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--foreground)]">Sell</span>
            <span className="text-[8px] text-[var(--muted)]">0 {symbol} · $0 · 0</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {SELL_PCTS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleSell(pct)}
                className="rounded-full border border-[var(--loss)] py-1.5 text-[10px] font-bold text-[var(--loss)] transition hover:bg-[var(--loss-soft)]"
              >
                {pct}%
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[8px] text-[var(--muted)]">
            <span className="font-bold text-[var(--gain)]">15%</span>
            <span>0.0 0.1 â–²</span>
            <span className="rounded border border-[var(--border)] px-1">Off</span>
            <span>Sell Init.</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-2 py-1 text-[8px] text-[var(--muted-dim)]">
          <span>0 0 0 0</span>
          <span>+0(+0%)</span>
        </div>
        {note && (
          <p className="border-t border-[var(--border)] px-2 py-1 text-[8px] text-[var(--primary)]">{note}</p>
        )}
      </div>
    </div>
  );
}