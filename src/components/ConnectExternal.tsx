"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  connectMetaMask,
  connectPhantom,
  connectTrustWallet,
  signEvmMessage,
  signSolanaMessage,
} from "@/lib/wallet/providers";
import { registerWallet } from "@/lib/wallet/register";
import { saveSession } from "@/lib/wallet/session";

const wallets = [
  { id: "metamask" as const, label: "MetaMask", emoji: "🦊", variant: "primary" as const },
  { id: "phantom" as const, label: "Phantom", emoji: "👻", variant: "secondary" as const },
  { id: "trust" as const, label: "Trust Wallet", emoji: "🛡️", variant: "secondary" as const },
];

export function ConnectExternal() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleEvm(provider: "metamask" | "trust") {
    setLoading(provider);
    setError(null);
    try {
      const address =
        provider === "metamask"
          ? await connectMetaMask()
          : await connectTrustWallet();

      const { message, signature, walletType } = await signEvmMessage(
        address,
        provider,
      );

      await registerWallet({
        address,
        chain: "ethereum",
        walletType,
        message,
        signature,
      });

      saveSession({
        mode: "external",
        walletType: provider,
        addresses: { ethereum: address },
        evmAddress: address,
      });

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(null);
    }
  }

  async function handlePhantom() {
    setLoading("phantom");
    setError(null);
    try {
      const address = await connectPhantom();
      const { message, signature, walletType } =
        await signSolanaMessage(address);

      await registerWallet({
        address,
        chain: "solana",
        walletType,
        message,
        signature,
      });

      saveSession({
        mode: "external",
        walletType: "phantom",
        addresses: { solana: address },
        solanaAddress: address,
      });

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(null);
    }
  }

  function handleClick(id: "metamask" | "phantom" | "trust") {
    if (id === "phantom") handlePhantom();
    else handleEvm(id);
  }

  return (
    <div className="space-y-3">
      {wallets.map(({ id, label, emoji, variant }) => (
        <Button
          key={id}
          className="w-full justify-start gap-3"
          variant={variant}
          onClick={() => handleClick(id)}
          disabled={Boolean(loading)}
        >
          <span className="text-lg">{emoji}</span>
          {loading === id ? "Connecting..." : `Connect ${label}`}
        </Button>
      ))}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}