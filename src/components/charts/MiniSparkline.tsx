"use client";

import type { PricePoint } from "@/app/api/prices/route";

type MiniSparklineProps = {
  data: PricePoint[];
  positive?: boolean;
  width?: number;
  height?: number;
};

export function MiniSparkline({
  data,
  positive = true,
  width = 88,
  height = 32,
}: MiniSparklineProps) {
  if (!data.length) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }

  const values = data.map((d) => d.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 2;

  const points = values
    .map((v, i) => {
      const x = pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2);
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const color = positive ? "var(--gain)" : "var(--loss)";
  const fillId = `spark-${positive ? "up" : "down"}-${width}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pad},${height - pad} ${points} ${width - pad},${height - pad}`}
        fill={`url(#${fillId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}