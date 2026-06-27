"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChainSelect } from "@/components/ui/ChainSelect";
import { Input } from "@/components/ui/Input";
import { ChainId, getChain } from "@/lib/wallet/chains";
import { getAddress, getSessionChains, SessionData } from "@/lib/wallet/session";
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

const SENDABLE: ChainId[] = ["ethereum", "solana"];

export function SendPanel({ session, onSuccess }: SendPanelProps) {
  const available = useMemo(
    () =>
      getSessionChains(session).filter(
        (c) => getChain(c).canSend && c !== "monero",
      ),
    [session],
  );

  const [chain, setChain] = useState<ChainId>(
    available.find((c) => SENDABLE.includes(c)) ?? available[0] ?? "ethereum",
  );
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const chainConfig = getChain(chain);
  const canTransact = SENDABLE.includes(chain);

  async function handleSend() {
    setError(null);
    setTxHash(null);

    if (!canTransact) {
      setError(
        `${chainConfig.name} send is rolling out soon. Use Receive to fund your wallet.`,
      );
      return;
    }

    if (!recipient || !amount || parseFloat(amount) <= 0) {
      setError("Enter a valid recipient and amount");
      return;
    }

    if (chain === "solana" && !isValidSolanaAddress(recipient)) {
      setError("Invalid Solana address");
      return;
    }

    if (chain === "ethereum" && !isValidEvmAddress(recipient)) {
      setError("Invalid Ethereum address");
      return;
    }

    setLoading(true);
    try {
      let hash: string;

      if (chain === "solana") {
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
        hash = await sendEvmNativeLocal(mnemonic, "ethereum", recipient, amount);
      } else {
        const from = getAddress(session, "ethereum");
        if (!from) throw new Error("No Ethereum wallet");
        hash = await sendEvmNativeExternal("ethereum", from, recipient, amount);
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
    <motion.div
      className="mx-auto max-w-lg"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Send</h1>
        <p className="mt-2 text-slate-500">
          Transfer crypto across your multi-chain vault.
        </p>
      </div>

      <Card className="space-y-5 shadow-lg shadow-blue-100/40">
        <ChainSelect
          label="Network"
          value={chain}
          onChange={setChain}
          chains={available.length ? available : ["ethereum", "solana"]}
        />

        {!canTransact && (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {chainConfig.name} send launches soon. Your receive address is ready
            in the Receive tab.
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Recipient address
          </label>
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={
              chain === "solana" ? "Solana address" : "Wallet address"
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Amount ({chainConfig.symbol})
          </label>
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
          {loading ? "Sending..." : `Send ${chainConfig.symbol}`}
        </Button>
      </Card>
    </motion.div>
  );
}