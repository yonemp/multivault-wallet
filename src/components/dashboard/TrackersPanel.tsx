"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FriendsPanel } from "@/components/dashboard/FriendsPanel";
import { getAccountUsername } from "@/lib/platform/account-username";
import { syncFriendsToWatched } from "@/lib/platform/friend-tracker-sync";
import type { FriendProfile } from "@/lib/platform/friends";
import {
  addWatchedWallet,
  loadWatchedWallets,
  removeWatchedWallet,
  WatchedWallet,
} from "@/lib/platform/watched-wallets";
import { AtSign, Download, Plus, Trash2, Upload, Users, Wallet } from "lucide-react";

const SUB_TABS = ["Wallet Manager", "Friends", "Live Trades", "Monitor", "KOLs"] as const;

function truncate(addr: string) {
  if (!addr || addr.length < 12) return addr || "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="text-sm font-semibold text-[var(--muted)]">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-[var(--muted-dim)]">{desc}</p>
    </div>
  );
}

function isVisibleWallet(w: WatchedWallet) {
  return w.source !== "friend" || w.active !== false;
}

export function TrackersPanel() {
  const [subTab, setSubTab] = useState<(typeof SUB_TABS)[number]>("Wallet Manager");
  const [wallets, setWallets] = useState<WatchedWallet[]>([]);
  const [hiddenFriendCount, setHiddenFriendCount] = useState(0);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refreshWallets = useCallback(() => {
    const all = loadWatchedWallets();
    setWallets(all.filter(isVisibleWallet));
    setHiddenFriendCount(all.filter((w) => w.source === "friend" && w.active === false).length);
  }, []);

  const syncFriends = useCallback(async () => {
    const username = getAccountUsername();
    if (!username) {
      refreshWallets();
      return;
    }
    try {
      const res = await fetch(`/api/friends?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = (await res.json()) as { friends?: FriendProfile[] };
        if (data.friends) syncFriendsToWatched(data.friends);
      }
    } catch {
      /* FriendsPanel handles local fallback */
    }
    refreshWallets();
  }, [refreshWallets]);

  useEffect(() => {
    void syncFriends();
  }, [syncFriends]);

  function handleAdd() {
    setError(null);
    try {
      if (!address.trim()) throw new Error("Enter wallet address");
      addWatchedWallet({ address: address.trim(), label: label.trim() || "Wallet", chain: "solana" });
      setAddress("");
      setLabel("");
      refreshWallets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(loadWatchedWallets(), null, 2)], { type: "application/json" });
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
          refreshWallets();
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
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                subTab === tab
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab === "Friends" && <Users className="h-3 w-3" />}
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

        {subTab === "Friends" && (
          <FriendsPanel onFriendsChanged={() => void syncFriends()} />
        )}

        {subTab === "Wallet Manager" && (
          <>
            <div className="grid gap-2 border-b border-[var(--border)] p-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Solana address" />
              <Button onClick={handleAdd} className="flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {error && <p className="mv-alert-error mx-3 text-xs">{error}</p>}
            {hiddenFriendCount > 0 && (
              <p className="mx-3 mt-2 text-[10px] text-[var(--muted)]">
                {hiddenFriendCount} inactive friend wallet{hiddenFriendCount === 1 ? "" : "s"} hidden (no activity in 30 days)
              </p>
            )}

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[var(--surface-solid)]">
                  <tr className="border-b border-[var(--border)] text-[9px] uppercase tracking-wider text-[var(--muted)]">
                    <th className="px-3 py-2">Wallet</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Chain</th>
                    <th className="px-3 py-2">Added</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w) => (
                    <tr key={w.id} className="ax-table-row">
                      <td className="px-3 py-2">
                        <p className="font-semibold">{w.label}</p>
                        <p className="font-mono text-[9px] text-[var(--muted)]">{truncate(w.address)}</p>
                      </td>
                      <td className="px-3 py-2 text-[10px] capitalize text-[var(--muted)]">
                        {w.source === "friend" ? (
                          <span className="text-[var(--primary)]">Friend</span>
                        ) : (
                          "Manual"
                        )}
                      </td>
                      <td className="px-3 py-2 text-[10px] capitalize text-[var(--muted)]">{w.chain}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-[var(--muted)]">
                        {new Date(w.addedAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {w.source !== "friend" && (
                          <button
                            type="button"
                            onClick={() => { removeWatchedWallet(w.id); refreshWallets(); }}
                            className="text-[var(--muted)] hover:text-[var(--loss)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!wallets.length && (
                    <tr>
                      <td colSpan={5} className="px-3 py-12 text-center">
                        <Wallet className="mx-auto mb-2 h-8 w-8 text-[var(--muted-dim)]" />
                        <p className="text-[var(--muted)]">Add wallets or friends to track</p>
                        <p className="mt-1 text-[10px] text-[var(--muted-dim)]">
                          Friends&apos; active wallets appear here automatically
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {subTab === "Live Trades" && (
          <EmptyState
            title="Live trades feed"
            desc="Per-wallet buy/sell stream needs a Solana transaction indexer. Tracked wallets (including friends) will appear here when the indexer is connected."
          />
        )}

        {subTab === "Monitor" && (
          <EmptyState
            title="Wallet monitor"
            desc="Real-time balance and position monitoring for tracked wallets. Connect an indexer to enable alerts when tracked wallets trade."
          />
        )}

        {subTab === "KOLs" && (
          <EmptyState
            title="KOL tracker"
            desc="Follow key opinion leaders and whale wallets. Add addresses in Wallet Manager or connect a curated KOL list API."
          />
        )}
      </div>

      <aside className="mv-panel flex w-full shrink-0 flex-col lg:w-[280px]">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
          <AtSign className="h-3.5 w-3.5 text-[var(--primary)]" />
          <span className="text-[11px] font-semibold">Twitter Alerts</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 overflow-y-auto px-4 py-8 text-center">
          <p className="text-[11px] font-semibold text-[var(--muted)]">No Twitter alerts yet</p>
          <p className="text-[10px] leading-relaxed text-[var(--muted-dim)]">
            Connect a Twitter/X API key to stream real alerts. Fabricated tweets are not shown.
          </p>
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