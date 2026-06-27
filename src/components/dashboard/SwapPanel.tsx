"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChainSelect } from "@/components/ui/ChainSelect";
import { TokenSelect } from "@/components/ui/TokenSelect";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { CustomTokenModal } from "@/components/dashboard/CustomTokenModal";
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
import { loadCustomTokens, removeCustomToken, CustomToken } from "@/lib/wallet/custom-tokens";
import { EvmChainKey } from "@/lib/wallet/evm";
import { getUnlockedMnemonic } from "@/lib/wallet/unlock-store";
import { Plus, Trash2 } from "lucide-react";

type SwapPanelProps = {
  session: SessionData;
  onSuccess: () => void;
};

type SwapChain = "ethereum" | "solana" | "bsc";

const SWAP_CHAINS: SwapChain[] = ["ethereum", "solana", "bsc"];

export function SwapPanel({ session, onSuccess }: SwapPanelProps) {
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([]);
  const [showAddToken, setShowAddToken] = useState(false);

  const available = useMemo(() => {
    const chains: ChainId[] = [];
    if (getAddress(session, "ethereum")) {
      chains.push("ethereum", "solana" as ChainId);
    } else if (getAddress(session, "solana")) {
      chains.push("solana");
    }
    return chains;
  }, [session]);

  const [chain, setChain] = useState<SwapChain>(
    getAddress(session, "ethereum") ? "ethereum" : "solana",
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

  const isSolana = chain === "solana";
  const evmChain: EvmChainKey = chain === "bsc" ? "bsc" : "ethereum";

  const tokenOptions = useMemo(() => {
    if (isSolana) {
      const base = [
        { id: "sol", label: "SOL", sublabel: "Solana" },
        { id: "usdc", label: "USDC", sublabel: "USD Coin" },
      ];
      const custom = customTokens
        .filter((t) => t.chain === "solana")
        .map((t) => ({ id: `custom:${t.id}`, label: t.symbol, sublabel: t.name }));
      return [...base, ...custom];
    }

    const nativeLabel = chain === "bsc" ? "BNB" : "ETH";
    const base = [
      { id: "native", label: nativeLabel, sublabel: chain === "bsc" ? "BNB Chain" : "Ethereum" },
      { id: "usdc", label: "USDC", sublabel: "USD Coin" },
    ];
    const custom = customTokens
      .filter((t) => t.chain === chain || (t.chain === "bsc" && chain === "bsc"))
      .map((t) => ({ id: `custom:${t.id}`, label: t.symbol, sublabel: t.name }));
    return [...base, ...custom];
  }, [isSolana, chain, customTokens]);

  const toOptions = tokenOptions.filter((t) => t.id !== fromToken);

  function refreshCustom() {
    setCustomTokens(loadCustomTokens());
  }

  useEffect(() => {
    refreshCustom();
  }, []);

  async function handleQuote() {
    setError(null);
    setQuotePreview(null);
    setQuoteData(null);
    setTxHash(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    if (fromToken.startsWith("custom:") || toToken.startsWith("custom:")) {
      setError("Custom token swaps require contract integration â€” add token for tracking, swap native/USDC for now.");
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
        if (!evmAddress) throw new Error("No EVM address");
        const quote = await fetchEvmSwapQuote({
          chain: evmChain,
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
          if (!mnemonic) throw new Error("Start a new browser session â€” create or import your wallet to enable signing");
          hash = await executeSolanaSwapLocal(mnemonic, quoteData);
        } else {
          const sol = getAddress(session, "solana");
          if (!sol) throw new Error("No Solana wallet");
          hash = await executeSolanaSwapExternal(quoteData, sol);
        }
      } else if (session.mode === "local") {
        const mnemonic = getUnlockedMnemonic();
        if (!mnemonic) throw new Error("Start a new browser session â€” create or import your wallet to enable signing");
        hash = await executeEvmSwapLocal(
          mnemonic,
          evmChain,
          quoteData as Awaited<ReturnType<typeof fetchEvmSwapQuote>>,
        );
      } else {
        const evm = getAddress(session, "ethereum");
        if (!evm) throw new Error("No EVM wallet");
        hash = await executeEvmSwapExternal(
          evmChain,
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

  const swapChainOptions = SWAP_CHAINS.filter((c) => {
    if (c === "solana") return !!getAddress(session, "solana");
    return !!getAddress(session, "ethereum");
  });

  if (!available.length && !getAddress(session, "ethereum")) {
    return (
      <p className="text-[var(--muted)]">
        Connect an Ethereum or Solana wallet to swap tokens.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="mb-5 border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Swap</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Jupiter (Solana) · LI.FI (Ethereum & BNB) · USDC · custom tokens
        </p>
      </div>

      <Panel className="space-y-4 p-5 shadow-[var(--shadow-md)]">
        <div className="flex flex-wrap gap-2">
          {swapChainOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setChain(c);
                setFromToken(c === "solana" ? "sol" : "native");
                setToToken("usdc");
                setQuotePreview(null);
                setQuoteData(null);
              }}
              className={`border px-3 py-1.5 text-xs font-semibold uppercase ${
                chain === c
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              {c === "bsc" ? "BNB" : c === "solana" ? "Solana" : "Ethereum"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <TokenSelect label="From" value={fromToken} onChange={setFromToken} options={tokenOptions} />
          <Button variant="ghost" className="mb-0.5 px-2" onClick={swapTokens}>â‡„</Button>
          <TokenSelect label="To" value={toToken} onChange={setToToken} options={toOptions} />
        </div>

        <div>
          <label className="mv-label">Amount</label>
          <Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" />
        </div>

        {quotePreview && <p className="mv-alert-info">Estimated: {quotePreview}</p>}
        {error && <p className="mv-alert-error">{error}</p>}
        {txHash && <p className="mv-alert-success break-all">Swapped! Tx: {txHash}</p>}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={handleQuote} disabled={quoting}>
            {quoting ? "Quotingâ€¦" : "Get quote"}
          </Button>
          <Button className="flex-1" onClick={handleSwap} disabled={loading || !quoteData}>
            {loading ? "Swappingâ€¦" : "Swap"}
          </Button>
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Custom tokens</h3>
          <Button size="sm" variant="secondary" onClick={() => setShowAddToken(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Track memecoins and alts by contract or mint address.
        </p>
        {customTokens.length > 0 && (
          <ul className="mt-3 space-y-2">
            {customTokens.map((t) => (
              <li key={t.id} className="flex items-center justify-between border border-[var(--border)] px-3 py-2 text-sm">
                <span>
                  <strong>{t.symbol}</strong>
                  <span className="ml-2 text-xs text-[var(--muted)]">{t.chain}</span>
                </span>
                <button type="button" onClick={() => { removeCustomToken(t.id); refreshCustom(); }} className="text-[var(--muted)] hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <CustomTokenModal open={showAddToken} onClose={() => setShowAddToken(false)} onAdded={refreshCustom} />
    </div>
  );
}