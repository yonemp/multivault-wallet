import { BRAND_NAME } from "@/lib/brand";
import { getLegacySessionItem } from "@/lib/storage/legacy-keys";

export type HealthEvent = {
  id: string;
  type: "error" | "rejection" | "react" | "info";
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  meta?: Record<string, string>;
};

const KEY = "tackers_health_log";
const MAX = 80;

function load(): HealthEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(getLegacySessionItem(KEY) ?? "[]") as HealthEvent[];
  } catch {
    return [];
  }
}

function save(events: HealthEvent[]) {
  sessionStorage.setItem(KEY, JSON.stringify(events.slice(-MAX)));
}

export function recordHealthEvent(
  type: HealthEvent["type"],
  message: string,
  stack?: string,
  meta?: Record<string, string>,
) {
  const event: HealthEvent = {
    id: `he-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    message,
    stack,
    url: typeof window !== "undefined" ? window.location.pathname : "",
    timestamp: Date.now(),
    meta,
  };

  const events = [...load(), event].slice(-MAX);
  save(events);

  if (type !== "info") {
    console.error(`[${BRAND_NAME} Health] ${type}:`, message, stack ?? "");
  }

  void reportToServer(event).catch(() => {});

  return event;
}

export function getHealthLog(): HealthEvent[] {
  return load();
}

export function clearHealthLog() {
  sessionStorage.removeItem(KEY);
}

async function reportToServer(event: HealthEvent) {
  await fetch("/api/health", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
}

let installed = false;

export function installHealthMonitor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    recordHealthEvent(
      "error",
      e.message || "Unknown error",
      e.error?.stack,
      { source: e.filename ?? "", line: String(e.lineno ?? "") },
    );
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    recordHealthEvent(
      "rejection",
      reason instanceof Error ? reason.message : String(reason),
      reason instanceof Error ? reason.stack : undefined,
    );
  });

  recordHealthEvent("info", "Health monitor active");
}