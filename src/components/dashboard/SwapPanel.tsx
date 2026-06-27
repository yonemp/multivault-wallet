"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChainSelect } from "@/components/ui/ChainSelect";
import { TokenSelect } from "@/components/ui/TokenSelect";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { ChainId } from "@/lib/wallet/chains";
import { getAddress, SessionData } from "@/lib/wallet/session";
import {
  executeEvmSwapExternal,
  executeEvmSwapLocal,
  executeSolanaSwapExternal,
  executeSolanaSwapLocal,
  fetchEvmSwapQuote,
  fetchSolanaSwapQuote,
  formatOutputAmount,
} from "@/lib/wallet/swap";
import { EvmTokenId, SolanaTokenId } from "@/lib/wallet/tokens";
import { getUnlockedMnemonic } from "@/lib/wallet/unlock-store";

type SwapPanelProps = {
  session: SessionData;
  onSuccess: () => void;
};

const SWAP_CHAINS: ChainId[] = ["ethereum", "solana"];

export function SwapPanel({ session, onSuccess }: SwapPanelProps) {
  const available = useMemo(
    () => SWAP_CHAINS.filter((c) => getAddress(session, c)),
    [session],
  );

  const [chain, setChain] = useState<ChainId>(available[0] ?? "ethereum");
  const [fromToken, setFromToken] = useState("native");
  const [toToken, setToToken] = useState("usdc");
  const [amount, setAmount] = useState("");
  const [quotePreview, setQuotePreview] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isSolana = chain === "solana";

  const tokenOptions = isSolana
    ? [
        { id: "sol", label: "SOL", sublabel: "Solana" },
        { id: "usdc", label: "USDC", sublabel: "USD Coin" },
      ]
    : [
        { id: "native", label: "ETH", sublabel: "Ethereum" },
        { id: "usdc", label: "USDC", sublabel: "USD Coin" },
      ];

  const toOptions = tokenOptions.filter((t) => t.id !== fromToken);

  async function handleQuote() {
    setError(null);
    setQuotePreview(null);
    setQuoteData(null);
    setTxHash(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setQuoting(true);
    try {
      if (isSolana) {
        const quote = await fetchSolanaSwapQuote({
          fromToken: fromToken as SolanaTokenId,
          toToken: toToken as SolanaTokenId,
          amount,
        });
        setQuoteData(quote);
        setQuotePreview(
          `${formatOutputAmount(quote.outAmount, toToken === "sol" ? 9 : 6)} ${toToken.toUpperCase()}`,
        );
      } else {
        const evmAddress = getAddress(session, "ethereum");
        if (!evmAddress) throw new Error("No Ethereum address");
        const quote = await fetchEvmSwapQuote({
          chain: "ethereum",
          fromToken: fromToken as EvmTokenId,
          toToken: toToken as EvmTokenId,
          amount,
          fromAddress: evmAddress,
        });
        setQuoteData(quote);
        setQuotePreview(
          `${formatOutputAmount(quote.estimate.toAmount, quote.action.toToken.decimals)} ${quote.action.toToken.symbol}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get quote");
    } finally {
      setQuoting(false);
    }
  }

  async function handleSwap() {
    if (!quoteData) {
      setError("Get a quote first");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let hash: string;

      if (isSolana) {
        if (session.mode === "local") {
          const mnemonic = getUnlockedMnemonic();
          if (!mnemonic) throw new Error("Unlock your wallet first");
          hash = await executeSolanaSwapLocal(mnemonic, quoteData);
        } else {
          const sol = getAddress(session, "solana");
          if (!sol) throw new Error("No Solana wallet");
          hash = await executeSolanaSwapExternal(quoteData, sol);
        }
      } else if (session.mode === "local") {
        const mnemonic = getUnlockedMnemonic();
        if (!mnemonic) throw new Error("Unlock your wallet first");
        hash = await executeEvmSwapLocal(
          mnemonic,
          "ethereum",
          quoteData as Awaited<ReturnType<typeof fetchEvmSwapQuote>>,
        );
      } else {
        const evm = getAddress(session, "ethereum");
        if (!evm) throw new Error("No EVM wallet");
        hash = await executeEvmSwapExternal(
          "ethereum",
          evm,
          quoteData as Awaited<ReturnType<typeof fetchEvmSwapQuote>>,
        );
      }

      setTxHash(hash);
      setAmount("");
      setQuotePreview(null);
      setQuoteData(null);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setLoading(false);
    }
  }

  function swapTokens() {
    setFromToken(toToken);
    setToToken(fromToken);
    setQuotePreview(null);
    setQuoteData(null);
  }

  if (!available.length) {
    return (
      <p className="text-[var(--muted)]">
        Connect an Ethereum or Solana wallet to swap tokens.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-5 border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Swap</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Jupiter (Solana) · LI.FI (Ethereum)
        </p>
      </div>

      <Panel className="space-y-4 p-5">
        <ChainSelect
          label="Network"
          value={chain}
          onChange={(next) => {
            setChain(next);
            setFromToken(next === "solana" ? "sol" : "native");
            setToToken("usdc");
            setQuotePreview(null);
            setQuoteData(null);
          }}
          chains={available}
        />

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <TokenSelect
            label="From"
            value={fromToken}
            onChange={setFromToken}
            options={tokenOptions}
          />
          <Button variant="ghost" className="mb-0.5 px-2" onClick={swapTokens}>
            ⇄
          </Button>
          <TokenSelect
            label="To"
            value={toToken}
            onChange={setToToken}
            options={toOptions}
          />
        </div>

        <div>
          <label className="mv-label">Amount</label>
          <Input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
          />
        </div>

        {quotePreview && <p className="mv-alert-info">Estimated: {quotePreview}</p>}
        {error && <p className="mv-alert-error">{error}</p>}
        {txHash && <p className="mv-alert-success break-all">Swapped! Tx: {txHash}</p>}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleQuote}
            disabled={quoting}
          >
            {quoting ? "Quoting…" : "Get quote"}
          </Button>
          <Button
            className="flex-1"
            onClick={handleSwap}
            disabled={loading || !quoteData}
          >
            {loading ? "Swapping…" : "Swap"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}