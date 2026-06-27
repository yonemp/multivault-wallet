import { SOLANA_TOKENS } from "@/lib/wallet/tokens";
import { NextResponse } from "next/server";

type QuoteBody = {
  fromToken: "sol" | "usdc";
  toToken: "sol" | "usdc";
  amount: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuoteBody;
    const { fromToken, toToken, amount } = body;

    if (!fromToken || !toToken || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (fromToken === toToken) {
      return NextResponse.json({ error: "Tokens must differ" }, { status: 400 });
    }

    const input = SOLANA_TOKENS[fromToken];
    const output = SOLANA_TOKENS[toToken];
    const rawAmount = Math.floor(parseFloat(amount) * 10 ** input.decimals);

    const params = new URLSearchParams({
      inputMint: input.mint,
      outputMint: output.mint,
      amount: String(rawAmount),
      slippageBps: "50",
    });

    const quoteRes = await fetch(
      `https://quote-api.jup.ag/v6/quote?${params}`,
      { headers: { Accept: "application/json" } },
    );

    if (!quoteRes.ok) {
      const error = await quoteRes.text();
      return NextResponse.json({ error: error || "Quote failed" }, { status: 502 });
    }

    const quote = await quoteRes.json();
    return NextResponse.json({ quote });
  } catch {
    return NextResponse.json({ error: "Quote failed" }, { status: 500 });
  }
}