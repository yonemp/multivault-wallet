"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  addWatchedWallet,
  loadWatchedWallets,
  removeWatchedWallet,
  WatchedWallet,
} from "@/lib/platform/watched-wallets";
import { AtSign, Download, Plus, Trash2, Upload } from "lucide-react";

const SUB_TABS = ["All", "Wallet Manager", "Live Trades", "Monitor", "KOLs"] as const;

const MOCK_ALERTS = [
  { user: "@cobie", text: "new sol memecoin just dropped", time: "2m" },
  { user: "@ansem", text: "watching $WIF closely", time: "8m" },
  { user: "@blknoiz06", text: "rotation into cat coins", time: "14m" },
  { user: "@solana", text: "ecosystem update thread", time: "22m" },
];

export function TrackersPanel() {
  const [subTab, setSubTab] = useState<(typeof SUB_TABS)[number]>("Wallet Manager");
  const [wallets, setWallets] = useState<WatchedWallet[]>([]);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setWallets(loadWatchedWallets());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleAdd() {
    setError(null);
    try {
      if (!address.trim()) throw new Error("Enter wallet address");
      addWatchedWallet({ address: address.trim(), label: label.trim() || "Wallet", chain: "solana" });
      setAddress("");
      setLabel("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(wallets, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "multivault-trackers.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text()) as WatchedWallet[];
        if (Array.isArray(data)) {
          localStorage.setItem("multivault_watched_wallets", JSON.stringify(data));
          refresh();
        }
      } catch {
        setError("Invalid import file");
      }
    };
    input.click();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 lg:flex-row">
      <div className="mv-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] px-3 py-2">
          {SUB_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                subTab === tab
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="ml-auto flex gap-1">
            <button type="button" onClick={handleImport} className="flex items-center gap-1 border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)]">
              <Upload className="h-3 w-3" /> Import
            </button>
            <button type="button" onClick={handleExport} className="flex items-center gap-1 border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)]">
              <Download className="h-3 w-3" /> Export
            </button>
          </div>
        </div>

        <div className="grid gap-2 border-b border-[var(--border)] p-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Solana address" />
          <Button onClick={handleAdd} className="flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        {error && <p className="mv-alert-error mx-3 text-xs">{error}</p>}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[var(--surface-solid)]">
              <tr className="border-b border-[var(--border)] text-[9px] uppercase tracking-wider text-[var(--muted)]">
                <th className="px-3 py-2">Wallet</th>
                <th className="px-3 py-2">Last trade</th>
                <th className="px-3 py-2 text-right">PnL</th>
                <th className="px-3 py-2 text-right">Win %</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {wallets.map((w) => (
                <tr key={w.id} className="ax-table-row">
                  <td className="px-3 py-2">
                    <p className="font-semibold">{w.label}</p>
                    <p className="font-mono text-[9px] text-[var(--muted)]">{w.address.slice(0, 8)}…{w.address.slice(-6)}</p>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-[var(--muted)]">BUY · 2m ago</td>
                  <td className="px-3 py-2 text-right font-mono text-[var(--gain)]">{w.pnl}</td>
                  <td className="px-3 py-2 text-right font-mono">{w.winRate}%</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => { removeWatchedWallet(w.id); refresh(); }} className="text-[var(--muted)] hover:text-[var(--loss)]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!wallets.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-[var(--muted)]">
                    Add wallets to track live trades and copy entries
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="mv-panel flex w-full shrink-0 flex-col lg:w-[280px]">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
          <AtSign className="h-3.5 w-3.5 text-[var(--primary)]" />
          <span className="text-[11px] font-semibold">Twitter Alerts</span>
        </div>
        <div className="flex-1 space-y-0 overflow-y-auto">
          {MOCK_ALERTS.map((a) => (
            <div key={a.user} className="border-b border-[var(--border)] px-3 py-2.5 hover:bg-[var(--surface-hover)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[var(--primary)]">{a.user}</span>
                <span className="text-[9px] text-[var(--muted-dim)]">{a.time}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-[var(--muted)]">{a.text}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border)] p-2">
          <button type="button" className="w-full border border-[var(--border)] py-1.5 text-[10px] font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]">
            Configure alerts
          </button>
        </div>
      </aside>
    </div>
  );
}