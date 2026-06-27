import { EVM_CHAINS } from "@/lib/wallet/evm";
import { EVM_TOKENS } from "@/lib/wallet/tokens";
import { NextResponse } from "next/server";

type QuoteBody = {
  chain: keyof typeof EVM_CHAINS;
  fromToken: "native" | "usdc";
  toToken: "native" | "usdc";
  amount: string;
  fromAddress: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuoteBody;
    const { chain, fromToken, toToken, amount, fromAddress } = body;

    if (!chain || !fromToken || !toToken || !amount || !fromAddress) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (fromToken === toToken) {
      return NextResponse.json({ error: "Tokens must differ" }, { status: 400 });
    }

    const chainConfig = EVM_CHAINS[chain];
    const tokens = EVM_TOKENS[chain];
    const decimals =
      fromToken === "native" ? tokens.decimals.native : tokens.decimals.usdc;
    const fromAmount = BigInt(
      Math.floor(parseFloat(amount) * 10 ** decimals),
    ).toString();

    const fromTokenAddress =
      fromToken === "native" ? tokens.native : tokens.usdc;
    const toTokenAddress = toToken === "native" ? tokens.native : tokens.usdc;

    const params = new URLSearchParams({
      fromChain: String(chainConfig.chainId),
      toChain: String(chainConfig.chainId),
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      fromAmount,
      fromAddress,
      slippage: "0.03",
    });

    const response = await fetch(`https://li.quest/v1/quote?${params}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: error || "Quote failed" }, { status: 502 });
    }

    const quote = await response.json();
    return NextResponse.json({ quote });
  } catch {
    return NextResponse.json({ error: "Quote failed" }, { status: 500 });
  }
}