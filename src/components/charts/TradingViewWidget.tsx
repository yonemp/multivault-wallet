"use client";

type TradingViewWidgetProps = {
  symbol?: string;
  height?: number;
};

export function TradingViewWidget({
  symbol = "BINANCE:SOLUSDT",
  height = 420,
}: TradingViewWidgetProps) {
  const src = `https://s.tradingview.com/widgetembed/?frameElementId=tv&symbol=${encodeURIComponent(symbol)}&interval=15&hidesidetoolbar=0&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hide_top_toolbar=0&hide_legend=0&save_image=0&locale=en`;

  return (
    <div className="w-full border border-[var(--border)] bg-[#101016]">
      <iframe
        title="TradingView chart"
        src={src}
        style={{ width: "100%", height }}
        className="block"
      />
    </div>
  );
}