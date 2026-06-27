"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BRAND_NAME } from "@/lib/brand";
import { SUGGESTED_PROMPTS } from "@/lib/ai/copilot-engine";
import type { MarketSnapshot } from "@/lib/ai/market-context";
import type { DashboardTab } from "@/components/dashboard/ActionTabs.types";
import {
  Bot,
  Brain,
  Coins,
  Layers,
  Loader2,
  Send,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { safeFixed } from "@/lib/format/numbers";

type IntelSubTab = "insights" | "copilot";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: "ai" | "local";
};

type InsightSection = {
  id: string;
  title: string;
  tag: string;
  body: string;
};

type IntelPanelProps = {
  onNavigate?: (tab: DashboardTab) => void;
};

function renderMarkdownLite(text: string) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={i} />;
    if (trimmed === "---") return <hr key={i} className="my-3 border-[var(--border)]" />;
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return (
        <p key={i} className="mb-2 font-semibold text-[var(--foreground)]">
          {trimmed.slice(2, -2)}
        </p>
      );
    }
    if (trimmed.startsWith("- ")) {
      return (
        <li key={i} className="ml-4 list-disc text-sm text-[var(--muted)]">
          {trimmed.slice(2).replace(/\*\*/g, "")}
        </li>
      );
    }
    if (trimmed.startsWith("*") && trimmed.endsWith("*")) {
      return (
        <p key={i} className="mt-2 text-xs italic text-[var(--muted-dim)]">
          {trimmed.slice(1, -1)}
        </p>
      );
    }
    return (
      <p key={i} className="mb-1.5 text-sm leading-relaxed text-[var(--muted)]">
        {trimmed.replace(/\*\*/g, "")}
      </p>
    );
  });
}

export function IntelPanel({ onNavigate }: IntelPanelProps) {
  const [subTab, setSubTab] = useState<IntelSubTab>("insights");
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [sections, setSections] = useState<InsightSection[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `I'm the ${BRAND_NAME} Intel copilot. Ask about memecoins, DeFi, AI-driven finance, Pulse discovery, or risk — I'll use live market context when available. I don't execute trades or give financial advice.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadInsights = useCallback(async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch("/api/insights");
      if (res.ok) {
        const data = (await res.json()) as {
          snapshot: MarketSnapshot;
          sections: InsightSection[];
        };
        setSnapshot(data.snapshot);
        setSections(data.sections);
      }
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, subTab]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("Copilot unavailable");

      const data = (await res.json()) as {
        reply: string;
        mode: "ai" | "local";
        snapshot?: MarketSnapshot;
      };

      if (data.snapshot) setSnapshot(data.snapshot);

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          mode: data.mode,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Copilot is temporarily unavailable. Try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const sol = snapshot?.sol;
  const pulse = snapshot?.pulse;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Intel"
        description="Market thesis, live memecoin data, and AI copilot for crypto × DeFi × finance"
      />

      <div className="mb-4 flex gap-1 border-b border-[var(--border)]">
        {(
          [
            { id: "insights" as const, label: "Market Insights", icon: TrendingUp },
            { id: "copilot" as const, label: "AI Copilot", icon: Bot },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              subTab === id
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {subTab === "insights" && (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4">
          {loadingInsights ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading live market data…
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="mv-panel p-4">
                  <div className="flex items-center gap-2 text-[var(--primary)]">
                    <Coins className="h-4 w-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">SOL</span>
                  </div>
                  <p className="mt-2 font-mono text-xl font-semibold">
                    ${safeFixed(sol?.price, 2)}
                  </p>
                  {sol && (
                    <p
                      className={`mt-1 text-xs font-mono ${sol.change24h >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}
                    >
                      {sol.change24h >= 0 ? "+" : ""}
                      {safeFixed(sol.change24h, 2)}% 24h
                    </p>
                  )}
                </div>

                <div className="mv-panel p-4">
                  <div className="flex items-center gap-2 text-[var(--primary)]">
                    <Zap className="h-4 w-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Pulse New</span>
                  </div>
                  <p className="mt-2 font-mono text-xl font-semibold">{pulse?.newCount ?? "—"}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Fresh launches in feed</p>
                </div>

                <div className="mv-panel p-4">
                  <div className="flex items-center gap-2 text-[var(--warning)]">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Final Stretch</span>
                  </div>
                  <p className="mt-2 font-mono text-xl font-semibold">{pulse?.finalCount ?? "—"}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Near migration</p>
                </div>

                <div className="mv-panel p-4">
                  <div className="flex items-center gap-2 text-[var(--gain)]">
                    <Layers className="h-4 w-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Migrated</span>
                  </div>
                  <p className="mt-2 font-mono text-xl font-semibold">{pulse?.migratedCount ?? "—"}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">On AMM liquidity</p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {sections.map((s) => (
                  <article key={s.id} className="mv-panel p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]">
                      {s.tag}
                    </p>
                    <h3 className="mt-1 text-base font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{s.body}</p>
                  </article>
                ))}
              </div>

              {pulse && pulse.topMovers.length > 0 && (
                <div className="mv-panel overflow-hidden">
                  <div className="border-b border-[var(--border)] px-4 py-3">
                    <h3 className="text-sm font-semibold">Top movers (Pulse sample)</h3>
                    <p className="text-xs text-[var(--muted)]">By estimated volume — not a recommendation</p>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {pulse.topMovers.map((t) => (
                      <div
                        key={`${t.symbol}-${t.column}`}
                        className="flex items-center justify-between px-4 py-2.5 text-sm"
                      >
                        <div>
                          <span className="font-semibold">${t.symbol}</span>
                          <span className="ml-2 text-xs capitalize text-[var(--muted)]">{t.column}</span>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <p>${(t.mcap / 1000).toFixed(1)}k mcap</p>
                          <p className="text-[var(--muted)]">{t.bondingProgress.toFixed(0)}% bond</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {onNavigate && (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => onNavigate("pulse")}>
                      Open Pulse
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => onNavigate("trade")}>
                      Open Trade
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setSubTab("copilot")}>
                      Ask Copilot
                    </Button>
                  </>
                )}
                <Button variant="secondary" size="sm" onClick={loadInsights}>
                  Refresh data
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {subTab === "copilot" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-3 rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[10px] text-[var(--muted)]">
            <Brain className="mr-1 inline h-3 w-3 text-[var(--primary)]" />
            Educational only — no trade execution. Add <code className="text-[var(--foreground)]">OPENAI_API_KEY</code>{" "}
            for full LLM responses; local intelligence used as fallback.
          </div>

          <div className="mv-panel min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded px-3 py-2 ${
                    m.role === "user"
                      ? "bg-[var(--primary-soft)] text-[var(--foreground)]"
                      : "border border-[var(--border)] bg-[var(--bg-elevated)]"
                  }`}
                >
                  {m.role === "assistant" && m.mode && (
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-[var(--muted)]">
                      {m.mode === "ai" ? "AI model" : "Local intel"}
                    </p>
                  )}
                  <div>{renderMarkdownLite(m.content)}</div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => sendMessage(p)}
                disabled={sending}
                className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about memecoins, DeFi, AI, risk…"
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}