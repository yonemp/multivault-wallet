"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clampPair, loadPulseColumnWidths, savePulseColumnWidths } from "@/lib/pulse/column-widths";

type Widths = [number, number, number];

export function usePulseColumnResize() {
  const [widths, setWidths] = useState<Widths>([33.33, 33.33, 33.34]);
  const [dragging, setDragging] = useState<0 | 1 | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const widthsRef = useRef(widths);

  useEffect(() => {
    setWidths(loadPulseColumnWidths());
  }, []);

  useEffect(() => {
    widthsRef.current = widths;
  }, [widths]);

  const startDrag = useCallback((handleIndex: 0 | 1, clientX: number) => {
    const startX = clientX;
    const startWidths = [...widthsRef.current] as Widths;
    const containerWidth = gridRef.current?.getBoundingClientRect().width ?? 1;

    setDragging(handleIndex);

    const onMove = (ev: MouseEvent) => {
      const deltaPct = ((ev.clientX - startX) / containerWidth) * 100;
      const next: Widths = [...startWidths];
      const left = handleIndex;
      const right = handleIndex + 1;
      const [newLeft, newRight] = clampPair(
        startWidths[left] + deltaPct,
        startWidths[right] - deltaPct,
      );
      next[left] = newLeft;
      next[right] = newRight;
      setWidths(next);
    };

    const onUp = () => {
      setDragging(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      savePulseColumnWidths(widthsRef.current);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  return { widths, dragging, gridRef, startDrag };
}