"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SessionData } from "@/lib/wallet/session";
import { EVM_CHAINS, EvmChainKey } from "@/lib/wallet/evm";
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

type SwapNetwork = "ethereum" | "polygon" | "bsc" | "solana";

export function SwapPanel({ session, onSuccess }: SwapPanelProps) {
  const [network, setNetwork] = useState<SwapNetwork>(
    session.solanaAddress && !session.evmAddress ? "solana" : "ethereum",
  );
  const [fromToken, setFromToken] = useState("native");
  const [toToken, setToToken] = useState("usdc");
  const [amount, setAmount] = useState("");
  const [quotePreview, setQuotePreview] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isSolana = network === "solana";

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
        const outDecimals = toToken === "sol" ? 9 : 6;
        setQuotePreview(
          `${formatOutputAmount(quote.outAmount, outDecimals)} ${toToken.toUpperCase()}`,
        );
      } else {
        if (!session.evmAddress) throw new Error("No EVM address");
        const quote = await fetchEvmSwapQuote({
          chain: network as EvmChainKey,
          fromToken: fromToken as EvmTokenId,
          toToken: toToken as EvmTokenId,
          amount,
          fromAddress: session.evmAddress,
        });
        setQuoteData(quote);
        setQuotePreview(
          `${formatOutputAmount(
            quote.estimate.toAmount,
            quote.action.toToken.decimals,
          )} ${quote.action.toToken.symbol}`,
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
          if (!session.solanaAddress) throw new Error("No Solana wallet");
          hash = await executeSolanaSwapExternal(quoteData, session.solanaAddress);
        }
      } else if (session.mode === "local") {
        const mnemonic = getUnlockedMnemonic();
        if (!mnemonic) throw new Error("Unlock your wallet first");
        hash = await executeEvmSwapLocal(
          mnemonic,
          network as EvmChainKey,
          quoteData as Awaited<ReturnType<typeof fetchEvmSwapQuote>>,
        );
      } else {
        if (!session.evmAddress) throw new Error("No EVM wallet");
        hash = await executeEvmSwapExternal(
          network as EvmChainKey,
          session.evmAddress,
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

  const tokenOptions = isSolana
    ? [
        { id: "sol", label: "SOL" },
        { id: "usdc", label: "USDC" },
      ]
    : [
        { id: "native", label: EVM_CHAINS[network as EvmChainKey].symbol },
        { id: "usdc", label: "USDC" },
      ];

  return (
    <div className="max-w-lg space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Swap tokens</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Swap via Jupiter (Solana) or LI.FI (EVM). Rates are estimates.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm text-zinc-400">Network</label>
        <Select
          value={network}
          onChange={(e) => {
            const next = e.target.value as SwapNetwork;
            setNetwork(next);
            setFromToken(next === "solana" ? "sol" : "native");
            setToToken("usdc");
            setQuotePreview(null);
            setQuoteData(null);
          }}
        >
          {session.evmAddress && (
            <>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="bsc">BNB Chain</option>
            </>
          )}
          {session.solanaAddress && <option value="solana">Solana</option>}
        </Select>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">From</label>
          <Select value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
            {tokenOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="ghost" className="mb-0.5 px-3" onClick={swapTokens}>
          ⇄
        </Button>
        <div>
          <label className="mb-2 block text-sm text-zinc-400">To</label>
          <Select value={toToken} onChange={(e) => setToToken(e.target.value)}>
            {tokenOptions
              .filter((t) => t.id !== fromToken)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
          </Select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-zinc-400">Amount</label>
        <Input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
        />
      </div>

      {quotePreview && (
        <p className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
          Estimated output: {quotePreview}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {txHash && (
        <p className="break-all rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Swapped! Tx: {txHash}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={handleQuote}
          disabled={quoting}
        >
          {quoting ? "Quoting..." : "Get quote"}
        </Button>
        <Button
          className="flex-1"
          onClick={handleSwap}
          disabled={loading || !quoteData}
        >
          {loading ? "Swapping..." : "Swap"}
        </Button>
      </div>
    </div>
  );
}