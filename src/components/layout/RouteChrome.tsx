"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppBackground } from "@/components/layout/AppBackground";
import { StatusBar } from "@/components/layout/StatusBar";

function isMarketingRoute(pathname: string) {
  if (pathname === "/") return true;
  return ["/create", "/import", "/sign-in", "/onboarding"].some((p) =>
    pathname.startsWith(p),
  );
}

export function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const marketing = isMarketingRoute(pathname);

  return (
    <div
      className={
        marketing
          ? "mv-route mv-route--marketing flex min-h-full flex-1 flex-col"
          : "mv-route mv-route--terminal flex min-h-full flex-1 flex-col pb-[var(--status-h)]"
      }
    >
      {!marketing && <AppBackground />}
      {children}
      {!marketing && <StatusBar />}
    </div>
  );
}