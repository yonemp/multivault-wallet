"use client";

import { useEffect, useRef, useState } from "react";
import type { PulseToken } from "@/app/api/pulse/route";
import { formatCompactUsd } from "@/lib/format/numbers";
import { formatPct, formatPulseAge } from "@/lib/pulse/format";
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Globe,
  Lock,
  ShieldCheck,
  Star,
} from "lucide-react";

type PulseCoinCardProps = {
  token: PulseToken;
  onTrade: () => void;
};

function AuditStat({ value, color }: { value?: number; color: string }) {
  return (
    <span className="ax-pulse-audit-stat" style={{ color }}>
      <span className="ax-pulse-audit-dot" style={{ background: color }} />
      {formatPct(value)}
    </span>
  );
}

export function PulseCoinCard({ token, onTrade }: PulseCoinCardProps) {
  const prevMcap = useRef(token.mcap);
  const prevVol = useRef(token.volume);
  const [mcFlash, setMcFlash] = useState<"up" | "down" | null>(null);
  const [volFlash, setVolFlash] = useState<"up" | "down" | null>(null);
  const [ageLabel, setAgeLabel] = useState(token.age);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (token.mcap !== prevMcap.current) {
      setMcFlash(token.mcap > prevMcap.current ? "up" : "down");
      prevMcap.current = token.mcap;
      const t = setTimeout(() => setMcFlash(null), 600);
      return () => clearTimeout(t);
    }
  }, [token.mcap]);

  useEffect(() => {
    if (token.volume !== prevVol.current) {
      setVolFlash(token.volume > prevVol.current ? "up" : "down");
      prevVol.current = token.volume;
      const t = setTimeout(() => setVolFlash(null), 600);
      return () => clearTimeout(t);
    }
  }, [token.volume]);

  useEffect(() => {
    if (!token.createdAt) {
      setAgeLabel(token.age);
      return;
    }
    const tick = () => setAgeLabel(formatPulseAge(Date.now() - token.createdAt!));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [token.createdAt, token.age]);

  const mcClass =
    mcFlash === "up"
      ? "ax-pulse-metric-flash-up"
      : mcFlash === "down"
        ? "ax-pulse-metric-flash-down"
        : "";

  const volClass =
    volFlash === "up"
      ? "ax-pulse-metric-flash-up"
      : volFlash === "down"
        ? "ax-pulse-metric-flash-down"
        : "";

  const buyCount = token.buyTx ?? 0;
  const sellCount = token.sellTx ?? 0;
  const solLiq = token.solLiquidity ?? 0;
  const solLabel = solLiq >= 1000 ? `${(solLiq / 1000).toFixed(1)}K` : solLiq.toFixed(solLiq < 10 ? 1 : 0);

  async function copyAddress(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(token.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="ax-pulse-coin-card group">
      <button type="button" onClick={onTrade} className="ax-pulse-coin-main">
        {token.imageUri ? (
          <img src={token.imageUri} alt="" className="ax-pulse-coin-avatar" />
        ) : (
          <div className="ax-pulse-coin-avatar ax-pulse-coin-avatar--fallback">
            {token.symbol.slice(0, 2)}
          </div>
        )}

        <div className="ax-pulse-coin-body">
          <div className="ax-pulse-coin-top">
            <div className="ax-pulse-coin-title-row">
              <span className="ax-pulse-coin-symbol">{token.symbol}</span>
              <span className="ax-pulse-coin-name">{token.name}</span>
              {token.dexPaid && <ShieldCheck className="ax-pulse-coin-icon ax-pulse-coin-icon--muted" />}
              <span className="ax-pulse-coin-age">{ageLabel}</span>
              <a
                href={token.pairUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="ax-pulse-coin-link"
                aria-label="Open on pump.fun"
              >
                <ExternalLink className="ax-pulse-coin-icon" />
              </a>
              <span className="ax-pulse-coin-stat ax-pulse-coin-stat--buy">
                <ArrowUpRight className="ax-pulse-coin-icon" />
                {buyCount}
              </span>
              <span className="ax-pulse-coin-stat ax-pulse-coin-stat--sell">
                <ArrowDownRight className="ax-pulse-coin-icon" />
                {sellCount}
              </span>
              <span className="ax-pulse-coin-stat ax-pulse-coin-stat--neutral">0</span>
              <span className="ax-pulse-coin-stat ax-pulse-coin-stat--holders">
                <Star className="ax-pulse-coin-icon ax-pulse-coin-icon--star" />
                {token.sniperCount ?? 0}/{token.holders ?? 0}
              </span>
            </div>

            <div className="ax-pulse-coin-metrics">
              <span className={`ax-pulse-coin-metric ${mcClass}`}>
                MC {formatCompactUsd(token.mcap)}
              </span>
              <span className={`ax-pulse-coin-metric ${volClass}`}>
                V {formatCompactUsd(token.volume)}
              </span>
              <span className="ax-pulse-coin-metric ax-pulse-coin-metric--sub">
                F {(token.feePct ?? 0).toFixed(1)}%
              </span>
              <span className="ax-pulse-coin-metric ax-pulse-coin-metric--sub">
                {token.txCount} TX
              </span>
              <span className="ax-pulse-coin-metric ax-pulse-coin-metric--sub">
                {token.proTraders ?? 0}
              </span>
            </div>
          </div>

          <div className="ax-pulse-coin-mid">
            {token.creatorHandle ? (
              <a
                href={token.twitterUrl ?? token.pairUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="ax-pulse-coin-creator"
              >
                @{token.creatorHandle}
                {token.creatorMetric ? ` ${token.creatorMetric}` : ""}
              </a>
            ) : (
              <span className="ax-pulse-coin-creator ax-pulse-coin-creator--muted">
                {token.protocol}
              </span>
            )}

            <button
              type="button"
              onClick={copyAddress}
              className="ax-pulse-coin-slug"
              title={copied ? "Copied!" : "Copy address"}
            >
              {copied ? "Copied" : token.addressSlug}
            </button>
          </div>

          <div className="ax-pulse-coin-bottom">
            <div className="ax-pulse-coin-audit">
              <AuditStat value={token.top10HoldersPct} color="var(--gain)" />
              <AuditStat value={token.devHoldingPct} color="var(--gain)" />
              <AuditStat value={token.snipersPct} color="#f5c842" />
              <AuditStat value={token.insidersPct} color="var(--gain)" />
              <AuditStat value={token.bundlePct} color="var(--muted)" />
              <span className="ax-pulse-audit-stat" style={{ color: "var(--muted)" }}>
                <span className="ax-pulse-audit-dot" style={{ background: "var(--muted)" }} />
                {token.proTraders ?? 0}
              </span>
            </div>

            <div className="ax-pulse-coin-actions">
              {token.hasWebsite && (
                <Globe className="ax-pulse-coin-icon ax-pulse-coin-icon--muted" />
              )}
              <span className="ax-pulse-sol-btn">
                <Lock className="ax-pulse-coin-icon" />
                {solLabel} SOL
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}