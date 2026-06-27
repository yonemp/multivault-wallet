"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { UsernamePicker } from "@/components/onboarding/UsernamePicker";
import {
  connectMetaMask,
  connectPhantom,
  connectTrustWallet,
  signEvmMessage,
  signSolanaMessage,
} from "@/lib/wallet/providers";
import { registerWallet } from "@/lib/wallet/register";
import { hasAccountUsername, saveUsernameForWallet } from "@/lib/platform/account-username";
import { saveSession, SessionData, getAddress } from "@/lib/wallet/session";

const wallets = [
  { id: "metamask" as const, label: "MetaMask", variant: "primary" as const },
  { id: "phantom" as const, label: "Phantom", variant: "secondary" as const },
  { id: "trust" as const, label: "Trust Wallet", variant: "secondary" as const },
];

export function ConnectExternal() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingSession, setPendingSession] = useState<SessionData | null>(null);

  function finishConnect(session: SessionData) {
    if (!hasAccountUsername()) {
      setPendingSession(session);
      return;
    }
    saveSession(session);
    window.location.href = "/dashboard";
  }

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

      finishConnect({
        mode: "external",
        walletType: provider,
        addresses: { ethereum: address },
        evmAddress: address,
      });
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

      finishConnect({
        mode: "external",
        walletType: "phantom",
        addresses: { solana: address },
        solanaAddress: address,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleUsername(username: string) {
    if (!pendingSession) return;
    const addr =
      getAddress(pendingSession, "ethereum") ??
      getAddress(pendingSession, "solana");
    if (!addr) throw new Error("No wallet address");
    await saveUsernameForWallet(addr, username);
    saveSession(pendingSession);
    window.location.href = "/dashboard";
  }

  function handleClick(id: "metamask" | "phantom" | "trust") {
    if (id === "phantom") handlePhantom();
    else handleEvm(id);
  }

  if (pendingSession) {
    return (
      <UsernamePicker
        title="Choose your username"
        description="Required to finish connecting your wallet. Used for support tickets and account moderation."
        submitLabel="Finish connecting"
        onSubmit={handleUsername}
      />
    );
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