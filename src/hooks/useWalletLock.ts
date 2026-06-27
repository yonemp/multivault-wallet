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
  formatLockRemaining,
  getLockRemainingMs,
  isUnlockValid,
  touchUnlockActivity,
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
      return;
    }
    const valid = restoreUnlockFromSession() && isUnlockValid();
    setUnlocked(valid);
    if (!valid) clearUnlockedMnemonic();
    setRemaining(formatLockRemaining(getLockRemainingMs()));
  }, [session]);

  useEffect(() => {
    syncLockState();
  }, [syncLockState]);

  useEffect(() => {
    if (!isLocal || !unlocked) return;

    const onActivity = () => touchUnlockActivity();

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;
    for (const e of events) {
      window.addEventListener(e, onActivity, { passive: true });
    }

    const interval = setInterval(() => {
      if (!isUnlockValid()) {
        clearUnlockedMnemonic();
        setUnlocked(false);
      }
      setRemaining(formatLockRemaining(getLockRemainingMs()));
    }, 1000);

    return () => {
      for (const e of events) {
        window.removeEventListener(e, onActivity);
      }
      clearInterval(interval);
    };
  }, [isLocal, unlocked]);

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
    } catch {
      setError("Incorrect password");
    }
  }

  function lock() {
    clearUnlockedMnemonic();
    setUnlocked(false);
    setPassword("");
    setError(null);
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