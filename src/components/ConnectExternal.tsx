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
        solanaAddress: address,
      });

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        className="w-full"
        onClick={() => handleEvm("metamask")}
        disabled={Boolean(loading)}
      >
        {loading === "metamask" ? "Connecting..." : "Connect MetaMask"}
      </Button>
      <Button
        className="w-full"
        variant="secondary"
        onClick={() => handlePhantom()}
        disabled={Boolean(loading)}
      >
        {loading === "phantom" ? "Connecting..." : "Connect Phantom"}
      </Button>
      <Button
        className="w-full"
        variant="secondary"
        onClick={() => handleEvm("trust")}
        disabled={Boolean(loading)}
      >
        {loading === "trust" ? "Connecting..." : "Connect Trust Wallet"}
      </Button>
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}