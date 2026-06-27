"use client";

import { useCallback, useEffect, useState } from "react";
import { SessionData } from "@/lib/wallet/session";
import {
  clearUnlockedMnemonic,
  restoreUnlockFromSession,
} from "@/lib/wallet/unlock-store";
import { isUnlockValid } from "@/lib/wallet/wallet-lock";
import { lockWalletSigning, verifyWalletPassword } from "@/lib/wallet/verify-password";

/** Session signing state — no auto lockout timer. Password required per sensitive action. */
export function useWalletLock(session: SessionData | null) {
  const [signingReady, setSigningReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isLocal = session?.mode === "local";

  const syncState = useCallback(() => {
    if (!session || session.mode === "external") {
      setSigningReady(session?.mode === "external");
      return;
    }
    setSigningReady(restoreUnlockFromSession() && isUnlockValid());
  }, [session]);

  useEffect(() => {
    syncState();
  }, [syncState]);

  async function unlock(persist = true) {
    setError(null);
    try {
      await verifyWalletPassword(password, { persist });
      setSigningReady(true);
      setPassword("");
    } catch {
      setError("Incorrect password");
    }
  }

  function lock() {
    lockWalletSigning();
    setSigningReady(false);
    setPassword("");
    setError(null);
  }

  return {
    unlocked: session?.mode === "external" || signingReady,
    isLocal,
    password,
    setPassword,
    error,
    remaining: "",
    unlock: () => unlock(true),
    lock,
    syncLockState: syncState,
  };
}