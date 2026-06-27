"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SessionData } from "@/lib/wallet/session";
import { EVM_CHAINS, EvmChainKey } from "@/lib/wallet/evm";
import {
  isValidEvmAddress,
  isValidSolanaAddress,
  sendEvmNativeExternal,
  sendEvmNativeLocal,
  sendSolanaExternal,
  sendSolanaLocal,
} from "@/lib/wallet/send";
import { getUnlockedMnemonic } from "@/lib/wallet/unlock-store";

type SendPanelProps = {
  session: SessionData;
  onSuccess: () => void;
};

type SendNetwork = "ethereum" | "polygon" | "bsc" | "solana";

export function SendPanel({ session, onSuccess }: SendPanelProps) {
  const [network, setNetwork] = useState<SendNetwork>(
    session.solanaAddress && !session.evmAddress ? "solana" : "ethereum",
  );
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isSolana = network === "solana";
  const symbol = isSolana
    ? "SOL"
    : EVM_CHAINS[network as EvmChainKey].symbol;

  async function handleSend() {
    setError(null);
    setTxHash(null);

    if (!recipient || !amount || parseFloat(amount) <= 0) {
      setError("Enter a valid recipient and amount");
      return;
    }

    if (isSolana && !isValidSolanaAddress(recipient)) {
      setError("Invalid Solana address");
      return;
    }

    if (!isSolana && !isValidEvmAddress(recipient)) {
      setError("Invalid EVM address");
      return;
    }

    setLoading(true);
    try {
      let hash: string;

      if (isSolana) {
        if (session.mode === "local") {
          const mnemonic = getUnlockedMnemonic();
          if (!mnemonic) throw new Error("Unlock your wallet first");
          hash = await sendSolanaLocal(mnemonic, recipient, amount);
        } else {
          hash = await sendSolanaExternal(recipient, amount);
        }
      } else if (session.mode === "local") {
        const mnemonic = getUnlockedMnemonic();
        if (!mnemonic) throw new Error("Unlock your wallet first");
        hash = await sendEvmNativeLocal(
          mnemonic,
          network as EvmChainKey,
          recipient,
          amount,
        );
      } else {
        if (!session.evmAddress) throw new Error("No EVM wallet connected");
        hash = await sendEvmNativeExternal(
          network as EvmChainKey,
          session.evmAddress,
          recipient,
          amount,
        );
      }

      setTxHash(hash);
      setRecipient("");
      setAmount("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Send</h1>
        <p className="mt-2 text-slate-500">
          Transfer native tokens to another wallet address.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-blue-100/40">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">Network</label>
        <Select
          value={network}
          onChange={(e) => setNetwork(e.target.value as SendNetwork)}
        >
          {session.evmAddress && (
            <>
              <option value="ethereum">Ethereum (ETH)</option>
              <option value="polygon">Polygon (MATIC)</option>
              <option value="bsc">BNB Chain (BNB)</option>
            </>
          )}
          {session.solanaAddress && <option value="solana">Solana (SOL)</option>}
        </Select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">Recipient address</label>
        <Input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder={isSolana ? "Solana address" : "0x..."}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">Amount ({symbol})</label>
        <Input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {txHash && (
        <p className="break-all rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Sent! Tx: {txHash}
        </p>
      )}

      <Button className="w-full" size="lg" onClick={handleSend} disabled={loading}>
        {loading ? "Sending..." : `Send ${symbol}`}
      </Button>
      </div>
    </div>
  );
}