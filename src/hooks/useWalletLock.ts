"use client";

import { useCallback, useEffect, useState } from "react";
import { deriveAllAddresses } from "@/lib/wallet/derive-all";
import { loadSession, saveSession, SessionData } from "@/lib/wallet/session";
import { decryptMnemonic, loadEncryptedWallet } from "@/lib/wallet/storage";
import { getActiveWalletId, getVaultWallet } from "@/lib/wallet/wallet-vault";
import {
  clearUnlockedMnemonic,
  restoreUnlockFromSession,
  setUnlockedMnemonic,
} from "@/lib/wallet/unlock-store";
import {
  checkReturnFromAway,
  formatLockRemaining,
  getLockRemainingMs,
  isUnlockValid,
  markSiteAway,
  shouldLockOnBoot,
} from "@/lib/wallet/wallet-lock";

export function useWalletLock(session: SessionData | null) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState("");

  const isLocal = session?.mode === "local";

  const syncLockState = useCallback(() => {
    if (!session) {
      setUnlocked(false);
      return;
    }
    if (session.mode === "external") {
      setUnlocked(true);
      setRemaining("");
      return;
    }

    if (shouldLockOnBoot()) {
      clearUnlockedMnemonic();
      setUnlocked(false);
      setRemaining("");
      return;
    }

    const valid = restoreUnlockFromSession() && isUnlockValid();
    setUnlocked(valid);
    setRemaining(valid ? "on terminal" : "");
  }, [session]);

  useEffect(() => {
    syncLockState();
  }, [syncLockState]);

  useEffect(() => {
    if (!isLocal) return;

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        markSiteAway();
        setRemaining(formatLockRemaining(getLockRemainingMs()));
        return;
      }

      const stillValid = checkReturnFromAway();
      if (!stillValid) {
        clearUnlockedMnemonic();
        setUnlocked(false);
        setRemaining("");
        return;
      }

      const valid = restoreUnlockFromSession() && isUnlockValid();
      setUnlocked(valid);
      setRemaining(valid ? "on terminal" : "");
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isLocal]);

  async function unlock() {
    setError(null);
    try {
      const activeId = getActiveWalletId() ?? session?.activeWalletId;
      const vaultWallet = activeId ? getVaultWallet(activeId) : undefined;
      const encrypted = vaultWallet?.encryptedPayload ?? loadEncryptedWallet();
      if (!encrypted) throw new Error("No local wallet found");
      const mnemonic = await decryptMnemonic(encrypted, password);
      const addresses = await deriveAllAddresses(mnemonic);
      const current = loadSession();
      if (!current) return;
      const updated: SessionData = {
        ...current,
        addresses,
        evmAddress: addresses.ethereum,
        solanaAddress: addresses.solana,
      };
      setUnlockedMnemonic(mnemonic);
      saveSession(updated);
      setUnlocked(true);
      setPassword("");
      setRemaining("on terminal");
    } catch {
      setError("Incorrect password");
    }
  }

  function lock() {
    clearUnlockedMnemonic();
    setUnlocked(false);
    setPassword("");
    setError(null);
    setRemaining("");
  }

  return {
    unlocked: session?.mode === "external" || unlocked,
    isLocal,
    password,
    setPassword,
    error,
    remaining,
    unlock,
    lock,
    syncLockState,
  };
}