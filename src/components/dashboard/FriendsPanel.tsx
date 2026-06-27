"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAccountUsername } from "@/lib/platform/account-username";
import {
  loadLocalFriends,
  localRemoveFriend,
  localRespondFriendRequest,
  localSendFriendRequest,
  type FriendProfile,
  type FriendRequest,
} from "@/lib/platform/friends";
import { syncFriendsToWatched } from "@/lib/platform/friend-tracker-sync";
import { Check, UserMinus, UserPlus, X } from "lucide-react";

type FriendsPanelProps = {
  onFriendsChanged?: () => void;
};

export function FriendsPanel({ onFriendsChanged }: FriendsPanelProps) {
  const username = getAccountUsername();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);

  const applySnapshot = useCallback(
    (data: {
      friends?: FriendProfile[];
      incoming?: FriendRequest[];
      outgoing?: FriendRequest[];
      setupRequired?: boolean;
    }) => {
      const nextFriends = data.friends ?? [];
      setFriends(nextFriends);
      setIncoming(data.incoming ?? []);
      setOutgoing(data.outgoing ?? []);
      setSetupRequired(data.setupRequired === true);
      syncFriendsToWatched(nextFriends);
      onFriendsChanged?.();
    },
    [onFriendsChanged],
  );

  const loadFriends = useCallback(async () => {
    if (!username) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/friends?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (res.ok) {
        applySnapshot(data);
      } else if (data.setupRequired) {
        applySnapshot(loadLocalFriends(username));
      } else {
        applySnapshot(loadLocalFriends(username));
        if (!data.error?.includes("friend_requests")) {
          setError(data.error ?? "Failed to load friends");
        }
      }
    } catch {
      if (username) applySnapshot(loadLocalFriends(username));
      setError("Could not reach server â€” using local friends");
    } finally {
      setLoading(false);
    }
  }, [username, applySnapshot]);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

  async function sendRequest() {
    if (!username || !target.trim()) return;
    setError(null);
    const toUsername = target.trim().toLowerCase();

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUsername: username, toUsername }),
      });
      const data = await res.json();
      if (res.ok) {
        setTarget("");
        if (data.autoAccepted && data.friends) {
          applySnapshot({
            friends: data.friends,
            incoming: [],
            outgoing: [],
          });
        }
        await loadFriends();
        return;
      }
      if (res.status === 503) {
        localSendFriendRequest(username, toUsername);
        setTarget("");
        applySnapshot(loadLocalFriends(username));
        return;
      }
      setError(data.error ?? "Failed to send request");
    } catch {
      try {
        localSendFriendRequest(username, toUsername);
        setTarget("");
        applySnapshot(loadLocalFriends(username));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send request");
      }
    }
  }

  async function respond(requestId: string, accept: boolean) {
    if (!username) return;
    setError(null);

    try {
      const res = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: accept ? "accept" : "decline", requestId, username }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.friends) applySnapshot({ ...loadLocalFriends(username), friends: data.friends });
        await loadFriends();
        return;
      }
      if (res.status === 503) {
        localRespondFriendRequest(requestId, username, accept);
        applySnapshot(loadLocalFriends(username));
        return;
      }
      setError(data.error ?? "Failed to update request");
    } catch {
      localRespondFriendRequest(requestId, username, accept);
      applySnapshot(loadLocalFriends(username));
    }
  }

  async function removeFriend(friendUsername: string) {
    if (!username) return;
    setError(null);

    try {
      const res = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", username, friendUsername }),
      });
      if (!res.ok && res.status !== 503) {
        const data = await res.json();
        setError(data.error ?? "Failed to remove friend");
        return;
      }
    } catch {
      /* fall through to local */
    }
    localRemoveFriend(username, friendUsername);
    await loadFriends();
  }

  if (!username) {
    return (
      <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">
        Set a username in Profile to use friends.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="grid gap-2 border-b border-[var(--border)] p-3 sm:grid-cols-[1fr_auto]">
        <Input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Add friend by username"
          onKeyDown={(e) => e.key === "Enter" && void sendRequest()}
        />
        <Button onClick={() => void sendRequest()} className="flex items-center gap-1">
          <UserPlus className="h-3.5 w-3.5" /> Send request
        </Button>
      </div>

      {error && <p className="mv-alert-error mx-3 mt-2 text-xs">{error}</p>}
      {setupRequired && (
        <p className="mx-3 mt-2 text-[10px] text-[var(--warning)]">
          Friends cloud DB not configured â€” requests work locally on this device until schema-v3 is run.
        </p>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-3">
        {incoming.length > 0 && (
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Incoming requests
            </h3>
            <div className="space-y-2">
              {incoming.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 border border-[var(--border)] px-3 py-2">
                  <span className="text-sm font-semibold">@{r.from_username}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void respond(r.id, true)}
                      className="border border-[var(--gain)] p-1.5 text-[var(--gain)] hover:bg-[var(--gain-soft)]"
                      title="Accept"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void respond(r.id, false)}
                      className="border border-[var(--border)] p-1.5 text-[var(--muted)] hover:text-[var(--loss)]"
                      title="Decline"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {outgoing.length > 0 && (
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Sent requests
            </h3>
            <div className="space-y-2">
              {outgoing.map((r) => (
                <div key={r.id} className="flex items-center justify-between border border-[var(--border)] px-3 py-2 text-sm">
                  <span className="font-semibold">@{r.to_username}</span>
                  <span className="text-[10px] text-[var(--muted)]">Pending</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Friends ({friends.length})
          </h3>
          {loading && !friends.length ? (
            <p className="text-sm text-[var(--muted)]">Loadingâ€¦</p>
          ) : friends.length ? (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.username} className="flex items-center justify-between gap-2 border border-[var(--border)] px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold">@{f.username}</p>
                    <p className="text-[10px] text-[var(--muted)]">
                      {f.active
                        ? "Active · auto-tracked in Wallet Manager"
                        : "Inactive · wallet hidden from trackers"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeFriend(f.username)}
                    className="border border-[var(--border)] p-1.5 text-[var(--muted)] hover:text-[var(--loss)]"
                    title="Remove friend"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              No friends yet. Send a request by username â€” when they accept, their wallet is tracked automatically.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}