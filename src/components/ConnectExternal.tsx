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
  { id: "metamask" as const, label: "MetaMask", variant: "primary" as const },
  { id: "phantom" as const, label: "Phantom", variant: "secondary" as const },
  { id: "trust" as const, label: "Trust Wallet", variant: "secondary" as const },
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
    <div className="space-y-2">
      {wallets.map(({ id, label, variant }) => (
        <Button
          key={id}
          className="w-full justify-center"
          variant={variant}
          onClick={() => handleClick(id)}
          disabled={Boolean(loading)}
        >
          {loading === id ? "Connecting…" : `Connect ${label}`}
        </Button>
      ))}
      {error && <p className="mv-alert-error">{error}</p>}
    </div>
  );
}