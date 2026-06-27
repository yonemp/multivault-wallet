"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LineSeries,
  LineStyle,
  UTCTimestamp,
  createChart,
} from "lightweight-charts";
import type { PricePoint } from "@/app/api/prices/route";

export type ChartLine = {
  id: string;
  price: number;
  color: string;
  label: string;
  style?: "solid" | "dashed";
};

type TradingChartProps = {
  data: PricePoint[];
  lines?: ChartLine[];
  height?: number;
  onPriceClick?: (price: number) => void;
};

export function TradingChart({
  data,
  lines = [],
  height = 380,
  onPriceClick,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const lineRefs = useRef<ISeriesApi<"Line">[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#5c6478",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(26,31,46,0.06)" },
        horzLines: { color: "rgba(26,31,46,0.06)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(26,31,46,0.1)" },
      timeScale: { borderColor: "rgba(26,31,46,0.1)" },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#2f6fed",
      topColor: "rgba(47,111,237,0.35)",
      bottomColor: "rgba(47,111,237,0.02)",
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    if (onPriceClick) {
      chart.subscribeClick((param) => {
        if (!param.point || !seriesRef.current) return;
        const price = seriesRef.current.coordinateToPrice(param.point.y);
        if (price != null) onPriceClick(price);
      });
    }

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      lineRefs.current = [];
    };
  }, [height, onPriceClick]);

  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    seriesRef.current.setData(
      data.map((d) => ({
        time: Math.floor(d.t / 1000) as UTCTimestamp,
        value: d.v,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  useEffect(() => {
    if (!chartRef.current) return;

    for (const line of lineRefs.current) {
      chartRef.current.removeSeries(line);
    }
    lineRefs.current = [];

    for (const line of lines) {
      const ls = chartRef.current!.addSeries(LineSeries, {
        color: line.color,
        lineWidth: 2,
        lineStyle: line.style === "dashed" ? LineStyle.Dashed : LineStyle.Solid,
        title: line.label,
        priceLineVisible: true,
        lastValueVisible: true,
      });

      if (data.length >= 2) {
        ls.setData([
          {
            time: Math.floor(data[0].t / 1000) as UTCTimestamp,
            value: line.price,
          },
          {
            time: Math.floor(data[data.length - 1].t / 1000) as UTCTimestamp,
            value: line.price,
          },
        ]);
      }

      lineRefs.current.push(ls);
    }
  }, [lines, data]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden border border-[var(--border)] bg-[var(--surface-solid)]"
    />
  );
}