"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { getLegacySessionItem } from "@/lib/storage/legacy-keys";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const BOOT_KEY = "tackers_booted";
    const seen = getLegacySessionItem(BOOT_KEY);
    if (seen) {
      setReady(true);
      return;
    }
    sessionStorage.setItem(BOOT_KEY, "1");
  }, []);

  return (
    <>
      <AnimatePresence>
        {!ready && (
          <LoadingScreen
            submessage="Preparing your multi-chain experience"
            duration={1800}
            onComplete={() => setReady(true)}
          />
        )}
      </AnimatePresence>
      {ready && children}
    </>
  );
}