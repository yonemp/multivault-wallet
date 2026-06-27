"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("mv_booted");
    if (seen) {
      setReady(true);
      return;
    }
    sessionStorage.setItem("mv_booted", "1");
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