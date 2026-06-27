"use client";

type PumpFunChartProps = {
  mint: string;
  height?: number;
};

export function PumpFunChart({ mint, height = 320 }: PumpFunChartProps) {
  const src = `https://pump.fun/coin/${mint}`;

  return (
    <div className="w-full border border-[var(--border)] bg-[#101016]">
      <iframe
        title="pump.fun chart"
        src={src}
        style={{ width: "100%", height }}
        className="block"
      />
    </div>
  );
}