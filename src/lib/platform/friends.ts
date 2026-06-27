export type FriendRequest = {
  id: string;
  from_username: string;
  to_username: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at?: string;
};

export type FriendProfile = {
  username: string;
  primaryAddress: string | null;
  lastSeenAt: string | null;
  active: boolean;
};

export type FriendsSnapshot = {
  friends: FriendProfile[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  setupRequired?: boolean;
};

const STORAGE_KEY = "mv_friends_local";

type LocalFriendsStore = {
  requests: FriendRequest[];
};

function readStore(): LocalFriendsStore {
  if (typeof window === "undefined") return { requests: [] };
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{"requests":[]}') as LocalFriendsStore;
  } catch {
    return { requests: [] };
  }
}

function writeStore(store: LocalFriendsStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function newId() {
  return `local-fr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadLocalFriends(username: string): FriendsSnapshot {
  const me = username.toLowerCase();
  const requests = readStore().requests;

  const friends = requests
    .filter((r) => r.status === "accepted" && (r.from_username === me || r.to_username === me))
    .map((r) => {
      const friendUsername = r.from_username === me ? r.to_username : r.from_username;
      return {
        username: friendUsername,
        primaryAddress: null,
        lastSeenAt: null,
        active: true,
      } satisfies FriendProfile;
    });

  return {
    friends,
    incoming: requests.filter((r) => r.status === "pending" && r.to_username === me),
    outgoing: requests.filter((r) => r.status === "pending" && r.from_username === me),
    setupRequired: true,
  };
}

export function localSendFriendRequest(fromUsername: string, toUsername: string) {
  const from = fromUsername.toLowerCase();
  const to = toUsername.toLowerCase();
  const store = readStore();

  if (from === to) throw new Error("You cannot add yourself");
  if (store.requests.some((r) => r.from_username === from && r.to_username === to && r.status !== "declined")) {
    throw new Error("Friend request already sent");
  }
  if (store.requests.some(
    (r) => r.status === "accepted" && (
      (r.from_username === from && r.to_username === to)
      || (r.from_username === to && r.to_username === from)
    ),
  )) {
    throw new Error("Already friends");
  }

  const existing = store.requests.find((r) => r.from_username === from && r.to_username === to);
  if (existing) {
    existing.status = "pending";
    existing.updated_at = new Date().toISOString();
  } else {
    store.requests.push({
      id: newId(),
      from_username: from,
      to_username: to,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  writeStore(store);
}

export function localRespondFriendRequest(requestId: string, username: string, accept: boolean) {
  const me = username.toLowerCase();
  const store = readStore();
  const req = store.requests.find((r) => r.id === requestId && r.to_username === me);
  if (!req) throw new Error("Request not found");
  req.status = accept ? "accepted" : "declined";
  req.updated_at = new Date().toISOString();
  writeStore(store);
}

export function localRemoveFriend(username: string, friendUsername: string) {
  const me = username.toLowerCase();
  const friend = friendUsername.toLowerCase();
  const store = readStore();
  store.requests = store.requests.filter(
    (r) =>
      !(
        r.status === "accepted"
        && ((r.from_username === me && r.to_username === friend)
          || (r.from_username === friend && r.to_username === me))
      ),
  );
  writeStore(store);
}