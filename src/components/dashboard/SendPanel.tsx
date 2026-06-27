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
    <div className="max-w-lg space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Send crypto</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Transfer native tokens to another wallet address.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm text-zinc-400">Network</label>
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
        <label className="mb-2 block text-sm text-zinc-400">Recipient address</label>
        <Input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder={isSolana ? "Solana address" : "0x..."}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-zinc-400">Amount ({symbol})</label>
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
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {txHash && (
        <p className="break-all rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Sent! Tx: {txHash}
        </p>
      )}

      <Button className="w-full" onClick={handleSend} disabled={loading}>
        {loading ? "Sending..." : `Send ${symbol}`}
      </Button>
    </div>
  );
}