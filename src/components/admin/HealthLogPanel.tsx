"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { clearHealthLog, getHealthLog, type HealthEvent } from "@/lib/platform/health-monitor";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

export function HealthLogPanel() {
  const [events, setEvents] = useState<HealthEvent[]>([]);

  function refresh() {
    setEvents(getHealthLog().reverse());
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
          <h3 className="text-sm font-semibold">Client health log</h3>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={refresh} className="border border-[var(--border)] p-1.5 text-[var(--muted)] hover:text-[var(--primary)]">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => { clearHealthLog(); refresh(); }} className="border border-[var(--border)] p-1.5 text-[var(--muted)] hover:text-[var(--loss)]">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="mb-3 text-[10px] text-[var(--muted)]">
        Auto-captures crashes, unhandled errors, and React boundary failures from this browser session.
      </p>
      <div className="max-h-48 space-y-1 overflow-y-auto font-mono text-[10px]">
        {events.map((e) => (
          <div key={e.id} className="border border-[var(--border)] px-2 py-1.5">
            <span className={`font-bold uppercase ${e.type === "error" || e.type === "react" ? "text-[var(--loss)]" : e.type === "rejection" ? "text-[var(--warning)]" : "text-[var(--muted)]"}`}>
              {e.type}
            </span>
            <span className="ml-2 text-[var(--muted-dim)]">{new Date(e.timestamp).toLocaleTimeString()}</span>
            <p className="mt-0.5 text-[var(--foreground)]">{e.message}</p>
          </div>
        ))}
        {!events.length && <p className="text-[var(--muted)]">No errors recorded this session</p>}
      </div>
    </Panel>
  );
}