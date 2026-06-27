"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { addCustomToken } from "@/lib/wallet/custom-tokens";
import { ChainId } from "@/lib/wallet/chains";
import { X } from "lucide-react";

type CustomTokenModalProps = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

const CHAIN_OPTIONS: { id: ChainId | "bsc"; label: string }[] = [
  { id: "ethereum", label: "Ethereum" },
  { id: "solana", label: "Solana" },
  { id: "bsc", label: "BNB Chain" },
];

export function CustomTokenModal({ open, onClose, onAdded }: CustomTokenModalProps) {
  const [chain, setChain] = useState<ChainId | "bsc">("ethereum");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [contract, setContract] = useState("");
  const [decimals, setDecimals] = useState("18");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleSubmit() {
    setError(null);
    try {
      if (!symbol.trim() || !name.trim() || !contract.trim()) {
        throw new Error("Fill in all required fields");
      }
      addCustomToken({
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        chain,
        contractOrMint: contract.trim(),
        decimals: parseInt(decimals, 10) || 18,
      });
      setSymbol("");
      setName("");
      setContract("");
      setDecimals("18");
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add token");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <Panel className="relative w-full max-w-md space-y-4 p-5 shadow-[var(--shadow-xl)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-[var(--foreground)]">Add custom token</h2>
        <p className="text-sm text-[var(--muted)]">
          Memecoins, alts, or any ERC-20 / SPL token by contract or mint address.
        </p>

        <div>
          <label className="mv-label">Network</label>
          <div className="flex flex-wrap gap-2">
            {CHAIN_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChain(c.id)}
                className={`border px-3 py-1.5 text-xs font-medium ${
                  chain === c.id
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mv-label">Symbol</label>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="PEPE" />
        </div>
        <div>
          <label className="mv-label">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pepe" />
        </div>
        <div>
          <label className="mv-label">{chain === "solana" ? "Mint address" : "Contract address"}</label>
          <Input value={contract} onChange={(e) => setContract(e.target.value)} placeholder="0x… or mint" />
        </div>
        <div>
          <label className="mv-label">Decimals</label>
          <Input type="number" value={decimals} onChange={(e) => setDecimals(e.target.value)} />
        </div>

        {error && <p className="mv-alert-error">{error}</p>}

        <Button className="w-full" size="lg" onClick={handleSubmit}>
          Add token
        </Button>
      </Panel>
    </div>
  );
}