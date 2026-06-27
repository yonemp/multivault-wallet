"use client";

import { useEffect } from "react";
import { installHealthMonitor } from "@/lib/platform/health-monitor";

export function HealthMonitor() {
  useEffect(() => {
    installHealthMonitor();
  }, []);

  return null;
}