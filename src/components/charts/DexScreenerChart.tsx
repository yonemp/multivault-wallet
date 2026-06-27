"use client";

type DexScreenerChartProps = {
  pairAddress: string;
  height?: number;
};

export function DexScreenerChart({ pairAddress, height = 320 }: DexScreenerChartProps) {
  const src = `https://dexscreener.com/solana/${pairAddress}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark`;

  return (
    <div className="w-full border border-[var(--border)] bg-[#101016]">
      <iframe
        title="DexScreener chart"
        src={src}
        style={{ width: "100%", height }}
        className="block"
      />
    </div>
  );
}