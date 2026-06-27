"use client";

import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export type PulseFilterTab = "protocols" | "audit" | "metrics" | "socials";

export type PulseColumnFilterState = {
  searchKeywords: string;
  excludeKeywords: string;
  protocols: string[];
  quoteTokens: string[];
  audit: {
    dexPaid: boolean;
    caEndsInPump: boolean;
    recentVisitorsMin: number;
    recentVisitorsMax: number;
    ageMinMins: number;
    ageMaxMins: number;
    top10HoldersPctMin: number;
    devHoldingPctMin: number;
    snipersPctMin: number;
    insidersPctMin: number;
    bundlePctMin: number;
    holdersMin: number;
    holdersMax: number;
    proTradersMin: number;
    proTradersMax: number;
    devMigrationsMin: number;
    devMigrationsMax: number;
    devPairsCreatedMin: number;
    devPairsCreatedMax: number;
  };
  metrics: {
    mcapMin: number;
    mcapMax: number;
    volMin: number;
    volMax: number;
    ageMaxMins: number;
  };
  socials: {
    twitter: boolean;
    telegram: boolean;
    website: boolean;
  };
};

export const DEFAULT_PULSE_FILTERS: PulseColumnFilterState = {
  searchKeywords: "",
  excludeKeywords: "",
  protocols: [],
  quoteTokens: [],
  audit: {
    dexPaid: false,
    caEndsInPump: false,
    recentVisitorsMin: 0,
    recentVisitorsMax: 0,
    ageMinMins: 0,
    ageMaxMins: 0,
    top10HoldersPctMin: 0,
    devHoldingPctMin: 0,
    snipersPctMin: 0,
    insidersPctMin: 0,
    bundlePctMin: 0,
    holdersMin: 0,
    holdersMax: 0,
    proTradersMin: 0,
    proTradersMax: 0,
    devMigrationsMin: 0,
    devMigrationsMax: 0,
    devPairsCreatedMin: 0,
    devPairsCreatedMax: 0,
  },
  metrics: { mcapMin: 0, mcapMax: 0, volMin: 0, volMax: 0, ageMaxMins: 0 },
  socials: { twitter: false, telegram: false, website: false },
};

const PROTOCOLS = [
  { id: "pump", label: "Pump", color: "#22c55e", bg: "rgba(34,197,94,0.18)" },
  { id: "bonk", label: "Bonk", color: "#f59e0b", bg: "rgba(245,158,11,0.18)" },
  { id: "liquid", label: "Liquid", color: "#3b82f6", bg: "rgba(59,130,246,0.18)" },
  { id: "moonshot", label: "Moonshot", color: "#a855f7", bg: "rgba(168,85,247,0.18)" },
  { id: "mayhem", label: "Mayhem", color: "#ef4444", bg: "rgba(239,68,68,0.18)" },
  { id: "bonkers", label: "Bonkers", color: "#f97316", bg: "rgba(249,115,22,0.18)" },
  { id: "surge", label: "Surge", color: "#10b981", bg: "rgba(16,185,129,0.18)" },
  { id: "heaven", label: "Heaven", color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  { id: "bags", label: "Bags", color: "#84cc16", bg: "rgba(132,204,22,0.18)" },
  { id: "print", label: "Print", color: "#8b5cf6", bg: "rgba(139,92,246,0.18)" },
  { id: "soar", label: "Soar", color: "#06b6d4", bg: "rgba(6,182,212,0.18)" },
  { id: "daos", label: "Daos.fun", color: "#6366f1", bg: "rgba(99,102,241,0.18)" },
  { id: "raydium", label: "Raydium", color: "#c084fc", bg: "rgba(192,132,252,0.15)" },
  { id: "meteora", label: "Meteora", color: "#f472b6", bg: "rgba(244,114,182,0.15)" },
  { id: "moonit", label: "Moonit", color: "#fcd34d", bg: "rgba(252,211,77,0.15)" },
  { id: "jupiter", label: "Jupiter", color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  { id: "orca", label: "Orca", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  { id: "believe", label: "Believe", color: "#fb7185", bg: "rgba(251,113,133,0.15)" },
  { id: "candle", label: "Candle", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  { id: "boop", label: "Boop", color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  { id: "launchlab", label: "LaunchLab", color: "#38bdf8", bg: "rgba(56,189,248,0.15)" },
  { id: "dynamic", label: "Dynamic BC", color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
  { id: "moonshotapp", label: "Moonshot App", color: "#c026d3", bg: "rgba(192,38,211,0.15)" },
  { id: "jupstudio", label: "Jup Studio", color: "#2dd4bf", bg: "rgba(45,212,191,0.15)" },
] as const;

const QUOTE_TOKENS = [
  { id: "SOL", label: "SOL", color: "#22c55e", bg: "rgba(34,197,94,0.2)" },
  { id: "USDC", label: "USDC", color: "#3b82f6", bg: "rgba(59,130,246,0.2)" },
  { id: "USDT", label: "USDT", color: "#eab308", bg: "rgba(234,179,8,0.2)" },
] as const;

const SOCIAL_OPTIONS = [
  { key: "twitter" as const, label: "Has Twitter" },
  { key: "telegram" as const, label: "Has Telegram" },
  { key: "website" as const, label: "Has Website" },
];

function parseKeywords(raw: string) {
  return raw
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

function countAuditFilters(a: PulseColumnFilterState["audit"]) {
  let n = 0;
  if (a.dexPaid) n++;
  if (a.caEndsInPump) n++;
  if (a.recentVisitorsMin || a.recentVisitorsMax) n++;
  if (a.ageMinMins || a.ageMaxMins) n++;
  if (a.top10HoldersPctMin) n++;
  if (a.devHoldingPctMin) n++;
  if (a.snipersPctMin) n++;
  if (a.insidersPctMin) n++;
  if (a.bundlePctMin) n++;
  if (a.holdersMin || a.holdersMax) n++;
  if (a.proTradersMin || a.proTradersMax) n++;
  if (a.devMigrationsMin || a.devMigrationsMax) n++;
  if (a.devPairsCreatedMin || a.devPairsCreatedMax) n++;
  return n;
}

function activeFilterCount(f: PulseColumnFilterState) {
  let n = 0;
  if (f.searchKeywords.trim()) n++;
  if (f.excludeKeywords.trim()) n++;
  if (f.protocols.length) n++;
  if (f.quoteTokens.length) n++;
  n += countAuditFilters(f.audit);
  if (f.metrics.mcapMin || f.metrics.mcapMax || f.metrics.volMin || f.metrics.volMax || f.metrics.ageMaxMins) n++;
  if (f.socials.twitter || f.socials.telegram || f.socials.website) n++;
  return n;
}

function AuditToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-[11px] font-semibold transition ${
        active
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)]"
      }`}
    >
      {label}
    </button>
  );
}

function AuditMinMax({
  label,
  min,
  max,
  onMin,
  onMax,
  suffix,
  minPlaceholder,
}: {
  label: string;
  min: number;
  max: number;
  onMin: (v: number) => void;
  onMax: (v: number) => void;
  suffix?: string;
  minPlaceholder?: string;
}) {
  return (
    <div className="ax-pulse-audit-row">
      <span className="ax-pulse-audit-label">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-semibold uppercase text-[var(--muted-dim)]">Min</span>
        <input
          type="number"
          min="0"
          value={min || ""}
          onChange={(e) => onMin(Number(e.target.value) || 0)}
          placeholder={minPlaceholder ?? "0"}
          className="ax-pulse-audit-input"
        />
        {suffix && <span className="text-[10px] text-[var(--muted-dim)]">{suffix}</span>}
        <span className="ml-1 text-[9px] font-semibold uppercase text-[var(--muted-dim)]">Max</span>
        <input
          type="number"
          min="0"
          value={max || ""}
          onChange={(e) => onMax(Number(e.target.value) || 0)}
          placeholder="0"
          className="ax-pulse-audit-input"
        />
        {suffix && <span className="text-[10px] text-[var(--muted-dim)]">{suffix}</span>}
      </div>
    </div>
  );
}

function AuditMinOnly({
  label,
  min,
  onMin,
  placeholder,
  suffix,
}: {
  label: string;
  min: number;
  onMin: (v: number) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div className="ax-pulse-audit-row">
      <span className="ax-pulse-audit-label">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-semibold uppercase text-[var(--muted-dim)]">Min</span>
        <input
          type="number"
          min="0"
          value={min || ""}
          onChange={(e) => onMin(Number(e.target.value) || 0)}
          placeholder={placeholder ?? "0"}
          className="ax-pulse-audit-input"
        />
        {suffix && <span className="text-[10px] text-[var(--muted-dim)]">{suffix}</span>}
      </div>
    </div>
  );
}

function TabBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3b82f6] px-1 text-[9px] font-bold text-white">
      {count}
    </span>
  );
}

type PulseColumnFiltersProps = {
  open: boolean;
  columnTitle: string;
  filters: PulseColumnFilterState;
  onChange: (f: PulseColumnFilterState) => void;
  onClose: () => void;
};

export function PulseColumnFilters({
  open,
  columnTitle,
  filters,
  onChange,
  onClose,
}: PulseColumnFiltersProps) {
  const [tab, setTab] = useState<PulseFilterTab>("protocols");
  const [showAllProtocols, setShowAllProtocols] = useState(false);

  const protocolCount = filters.protocols.length;
  const auditCount = countAuditFilters(filters.audit);
  const metricsCount = [
    filters.metrics.mcapMin,
    filters.metrics.mcapMax,
    filters.metrics.volMin,
    filters.metrics.volMax,
    filters.metrics.ageMaxMins,
  ].filter(Boolean).length;
  const socialCount = [filters.socials.twitter, filters.socials.telegram, filters.socials.website].filter(Boolean).length;

  const visibleProtocols = useMemo(
    () => (showAllProtocols ? PROTOCOLS : PROTOCOLS.slice(0, 12)),
    [showAllProtocols],
  );

  if (!open) return null;

  function toggleProtocol(id: string) {
    const next = filters.protocols.includes(id)
      ? filters.protocols.filter((p) => p !== id)
      : [...filters.protocols, id];
    onChange({ ...filters, protocols: next });
  }

  function toggleQuote(id: string) {
    const next = filters.quoteTokens.includes(id)
      ? filters.quoteTokens.filter((q) => q !== id)
      : [...filters.quoteTokens, id];
    onChange({ ...filters, quoteTokens: next });
  }

  return (
    <div className="ax-pulse-filter-overlay">
      <div className="ax-pulse-filter-panel">
        <div className="flex items-center justify-between border-b border-[var(--border-strong)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Filters</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="border-b border-[var(--border)] px-4 py-2 text-[10px] text-[var(--muted)]">
          {columnTitle}
        </p>

        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Search Keywords</label>
              <input
                value={filters.searchKeywords}
                onChange={(e) => onChange({ ...filters, searchKeywords: e.target.value })}
                placeholder="keyword1, keyword2"
                className="ax-pulse-filter-input w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--muted)]">Exclude Keywords</label>
              <input
                value={filters.excludeKeywords}
                onChange={(e) => onChange({ ...filters, excludeKeywords: e.target.value })}
                placeholder="keyword1, keyword2"
                className="ax-pulse-filter-input w-full"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-4 border-b border-[var(--border)] pb-2">
            {([
              { id: "protocols" as const, label: "Protocols", count: protocolCount },
              { id: "audit" as const, label: "Audit", count: auditCount },
              { id: "metrics" as const, label: "$ Metrics", count: metricsCount },
              { id: "socials" as const, label: "Socials", count: socialCount },
            ]).map(({ id, label, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex items-center pb-2 text-[11px] font-semibold transition ${
                  tab === id
                    ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {label}
                <TabBadge count={count} />
              </button>
            ))}
          </div>

          {tab === "protocols" && (
            <div className="mt-3 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--foreground)]">Protocols</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...filters, protocols: [] })}
                  className="text-[10px] font-medium text-[var(--muted)] hover:text-[var(--primary)]"
                >
                  Unselect All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleProtocols.map((p) => {
                  const active = filters.protocols.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProtocol(p.id)}
                      className="ax-pulse-protocol-pill"
                      style={{
                        color: p.color,
                        background: active ? p.bg : "rgba(255,255,255,0.04)",
                        borderColor: active ? p.color : "var(--border)",
                        boxShadow: active ? `0 0 0 1px ${p.color}44` : undefined,
                      }}
                    >
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold"
                        style={{ background: p.bg, color: p.color }}
                      >
                        {p.label.slice(0, 1)}
                      </span>
                      {p.label}
                    </button>
                  );
                })}
              </div>
              {PROTOCOLS.length > 12 && (
                <button
                  type="button"
                  onClick={() => setShowAllProtocols((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {showAllProtocols ? "Show less" : `Show more ${PROTOCOLS.length - 12}`}
                  <ChevronDown className={`h-3.5 w-3.5 transition ${showAllProtocols ? "rotate-180" : ""}`} />
                </button>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[var(--foreground)]">Quote Tokens</span>
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, quoteTokens: [] })}
                    className="text-[10px] font-medium text-[var(--muted)] hover:text-[var(--primary)]"
                  >
                    Unselect All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUOTE_TOKENS.map((q) => {
                    const active = filters.quoteTokens.includes(q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => toggleQuote(q.id)}
                        className="ax-pulse-protocol-pill"
                        style={{
                          color: q.color,
                          background: active ? q.bg : "rgba(255,255,255,0.04)",
                          borderColor: active ? q.color : "var(--border)",
                        }}
                      >
                        {q.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "audit" && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <AuditToggle
                  label="Dex Paid"
                  active={filters.audit.dexPaid}
                  onClick={() =>
                    onChange({
                      ...filters,
                      audit: { ...filters.audit, dexPaid: !filters.audit.dexPaid },
                    })
                  }
                />
                <AuditToggle
                  label={"CA ends in 'pump'"}
                  active={filters.audit.caEndsInPump}
                  onClick={() =>
                    onChange({
                      ...filters,
                      audit: { ...filters.audit, caEndsInPump: !filters.audit.caEndsInPump },
                    })
                  }
                />
              </div>

              <AuditMinMax
                label="Recent Visitors"
                min={filters.audit.recentVisitorsMin}
                max={filters.audit.recentVisitorsMax}
                onMin={(v) => onChange({ ...filters, audit: { ...filters.audit, recentVisitorsMin: v } })}
                onMax={(v) => onChange({ ...filters, audit: { ...filters.audit, recentVisitorsMax: v } })}
              />

              <AuditMinMax
                label="Age"
                min={filters.audit.ageMinMins}
                max={filters.audit.ageMaxMins}
                onMin={(v) => onChange({ ...filters, audit: { ...filters.audit, ageMinMins: v } })}
                onMax={(v) => onChange({ ...filters, audit: { ...filters.audit, ageMaxMins: v } })}
                suffix="m"
              />

              <AuditMinOnly
                label="Top 10 Holders %"
                min={filters.audit.top10HoldersPctMin}
                onMin={(v) => onChange({ ...filters, audit: { ...filters.audit, top10HoldersPctMin: v } })}
                placeholder="20"
              />
              <AuditMinOnly
                label="Dev Holding %"
                min={filters.audit.devHoldingPctMin}
                onMin={(v) => onChange({ ...filters, audit: { ...filters.audit, devHoldingPctMin: v } })}
                placeholder="10"
              />
              <AuditMinOnly
                label="Snipers %"
                min={filters.audit.snipersPctMin}
                onMin={(v) => onChange({ ...filters, audit: { ...filters.audit, snipersPctMin: v } })}
                placeholder="30"
              />
              <AuditMinOnly
                label="Insiders %"
                min={filters.audit.insidersPctMin}
                onMin={(v) => onChange({ ...filters, audit: { ...filters.audit, insidersPctMin: v } })}
                placeholder="15"
              />
              <AuditMinOnly
                label="Bundle %"
                min={filters.audit.bundlePctMin}
                onMin={(v) => onChange({ ...filters, audit: { ...filters.audit, bundlePctMin: v } })}
                placeholder="30"
              />

              <AuditMinMax
                label="Holders"
                min={filters.audit.holdersMin}
                max={filters.audit.holdersMax}
                onMin={(v) => onChange({ ...filters, audit: { ...filters.audit, holdersMin: v } })}
                onMax={(v) => onChange({ ...filters, audit: { ...filters.audit, holdersMax: v } })}
              />

              <AuditMinMax
                label="Pro Traders"
                min={filters.audit.proTradersMin}
                max={filters.audit.proTradersMax}
                minPlaceholder="5"
                onMin={(v) => onChange({ ...filters, audit: { ...filters.audit, proTradersMin: v } })}
                onMax={(v) => onChange({ ...filters, audit: { ...filters.audit, proTradersMax: v } })}
              />

              <AuditMinMax
                label="Dev Migrations"
                min={filters.audit.devMigrationsMin}
                max={filters.audit.devMigrationsMax}
                onMin={(v) => onChange({ ...filters, audit: { ...filters.audit, devMigrationsMin: v } })}
                onMax={(v) => onChange({ ...filters, audit: { ...filters.audit, devMigrationsMax: v } })}
              />

              <AuditMinMax
                label="Dev Pairs Created"
                min={filters.audit.devPairsCreatedMin}
                max={filters.audit.devPairsCreatedMax}
                onMin={(v) => onChange({ ...filters, audit: { ...filters.audit, devPairsCreatedMin: v } })}
                onMax={(v) => onChange({ ...filters, audit: { ...filters.audit, devPairsCreatedMax: v } })}
              />
            </div>
          )}

          {tab === "metrics" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {([
                { key: "mcapMin" as const, label: "MC min ($)" },
                { key: "mcapMax" as const, label: "MC max ($)" },
                { key: "volMin" as const, label: "Vol min ($)" },
                { key: "volMax" as const, label: "Vol max ($)" },
                { key: "ageMaxMins" as const, label: "Max age (mins)" },
              ]).map(({ key, label }) => (
                <div key={key} className={key === "ageMaxMins" ? "col-span-2" : ""}>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-dim)]">
                    {label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.metrics[key] || ""}
                    onChange={(e) =>
                      onChange({
                        ...filters,
                        metrics: { ...filters.metrics, [key]: Number(e.target.value) || 0 },
                      })
                    }
                    placeholder="0"
                    className="ax-pulse-filter-input w-full"
                  />
                </div>
              ))}
            </div>
          )}

          {tab === "socials" && (
            <div className="mt-3 space-y-2">
              {SOCIAL_OPTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md border border-[var(--border)] px-3 py-2.5 text-xs transition hover:border-[var(--border-strong)]"
                >
                  <input
                    type="checkbox"
                    checked={filters.socials[key]}
                    onChange={(e) =>
                      onChange({
                        ...filters,
                        socials: { ...filters.socials, [key]: e.target.checked },
                      })
                    }
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-[var(--muted)]">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-[var(--border-strong)] px-4 py-3">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_PULSE_FILTERS)}
            className="flex-1 rounded-md border border-[var(--border)] py-2 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
          >
            Reset all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md bg-[var(--primary)] py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export function countActivePulseFilters(f: PulseColumnFilterState) {
  return activeFilterCount(f);
}

function passesMinMax(
  value: number | undefined,
  min: number,
  max: number,
): boolean {
  if (!min && !max) return true;
  if (value == null) return false;
  if (min && value < min) return false;
  if (max && value > max) return false;
  return true;
}

function passesMin(value: number | undefined, min: number): boolean {
  if (!min) return true;
  if (value == null) return false;
  return value >= min;
}

export function applyPulseColumnFilters<
  T extends {
    symbol: string;
    name: string;
    address: string;
    mcap: number;
    volume: number;
    ageMs: number;
    txCount: number;
    protocol: string;
    quoteToken?: string;
    column: string;
    isLive?: boolean;
    hasTwitter?: boolean;
    hasTelegram?: boolean;
    hasWebsite?: boolean;
    dexPaid?: boolean;
    caEndsInPump?: boolean;
    recentVisitors?: number;
    top10HoldersPct?: number;
    devHoldingPct?: number;
    snipersPct?: number;
    insidersPct?: number;
    bundlePct?: number;
    holders?: number;
    proTraders?: number;
    devMigrations?: number;
    devPairsCreated?: number;
  },
>(tokens: T[], f: PulseColumnFilterState): T[] {
  const include = parseKeywords(f.searchKeywords);
  const exclude = parseKeywords(f.excludeKeywords);

  return tokens.filter((t) => {
    const hay = `${t.symbol} ${t.name} ${t.address}`.toLowerCase();

    if (include.length && !include.some((k) => hay.includes(k))) return false;
    if (exclude.length && exclude.some((k) => hay.includes(k))) return false;

    if (f.protocols.length) {
      const proto = t.protocol.toLowerCase().replace(/\.fun$/, "").replace(/\s/g, "");
      const match = f.protocols.some((p) => proto.includes(p) || p.includes(proto));
      if (!match) return false;
    }

    if (f.quoteTokens.length) {
      const qt = t.quoteToken ?? "SOL";
      if (!f.quoteTokens.includes(qt)) return false;
    }

    const a = f.audit;
    if (a.dexPaid && !t.dexPaid) return false;
    if (a.caEndsInPump && !t.caEndsInPump) return false;

    if (!passesMinMax(t.recentVisitors, a.recentVisitorsMin, a.recentVisitorsMax)) return false;

    const ageMins = t.ageMs / 60_000;
    if (a.ageMinMins && ageMins < a.ageMinMins) return false;
    if (a.ageMaxMins && ageMins > a.ageMaxMins) return false;

    if (!passesMin(t.top10HoldersPct, a.top10HoldersPctMin)) return false;
    if (!passesMin(t.devHoldingPct, a.devHoldingPctMin)) return false;
    if (!passesMin(t.snipersPct, a.snipersPctMin)) return false;
    if (!passesMin(t.insidersPct, a.insidersPctMin)) return false;
    if (!passesMin(t.bundlePct, a.bundlePctMin)) return false;
    if (!passesMinMax(t.holders, a.holdersMin, a.holdersMax)) return false;
    if (!passesMinMax(t.proTraders, a.proTradersMin, a.proTradersMax)) return false;
    if (!passesMinMax(t.devMigrations, a.devMigrationsMin, a.devMigrationsMax)) return false;
    if (!passesMinMax(t.devPairsCreated, a.devPairsCreatedMin, a.devPairsCreatedMax)) return false;

    if (f.metrics.mcapMin && t.mcap < f.metrics.mcapMin) return false;
    if (f.metrics.mcapMax && t.mcap > f.metrics.mcapMax) return false;
    if (f.metrics.volMin && t.volume < f.metrics.volMin) return false;
    if (f.metrics.volMax && t.volume > f.metrics.volMax) return false;
    if (f.metrics.ageMaxMins && t.ageMs > f.metrics.ageMaxMins * 60_000) return false;

    if (f.socials.twitter && !t.hasTwitter) return false;
    if (f.socials.telegram && !t.hasTelegram) return false;
    if (f.socials.website && !t.hasWebsite) return false;

    return true;
  });
}