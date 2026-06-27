export type LocalSupportTicket = {
  id: string;
  remoteId?: string | null;
  walletAddress: string | null;
  chain: string | null;
  username: string | null;
  subject: string;
  body: string;
  status: "open" | "answered" | "closed";
  adminReply?: string | null;
  createdAt: number;
  synced: boolean;
};

export type RemoteSupportTicket = {
  id: string;
  wallet_address?: string | null;
  chain?: string | null;
  username?: string | null;
  subject: string;
  body: string;
  status: string;
  admin_reply?: string | null;
  created_at: string;
};

const STORAGE_KEY = "mv_support_tickets";

function readAll(): LocalSupportTicket[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as LocalSupportTicket[];
  } catch {
    return [];
  }
}

function writeAll(tickets: LocalSupportTicket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets.slice(-50)));
}

export function saveLocalTicket(
  input: Omit<LocalSupportTicket, "id" | "createdAt" | "status" | "synced"> & { synced?: boolean },
): LocalSupportTicket {
  const ticket: LocalSupportTicket = {
    id: `local-${Date.now()}`,
    walletAddress: input.walletAddress,
    chain: input.chain,
    username: input.username ?? null,
    subject: input.subject,
    body: input.body,
    status: "open",
    createdAt: Date.now(),
    synced: input.synced ?? false,
  };
  writeAll([...readAll(), ticket]);
  return ticket;
}

export function loadLocalTickets(): LocalSupportTicket[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function markTicketSynced(id: string, remoteId?: string) {
  writeAll(
    readAll().map((t) =>
      t.id === id ? { ...t, synced: true, remoteId: remoteId ?? t.remoteId ?? null } : t,
    ),
  );
}

export function syncLocalTicketsFromRemote(remote: RemoteSupportTicket[]) {
  const all = readAll();
  const byRemote = new Map(remote.map((t) => [t.id, t]));
  const updated = all.map((local) => {
    const match =
      (local.remoteId && byRemote.get(local.remoteId))
      ?? remote.find(
        (r) =>
          r.subject === local.subject
          && r.body === local.body
          && Math.abs(Date.parse(r.created_at) - local.createdAt) < 60_000,
      );
    if (!match) return local;
    return {
      ...local,
      remoteId: match.id,
      synced: true,
      status: (match.status as LocalSupportTicket["status"]) || local.status,
      adminReply: match.admin_reply ?? local.adminReply ?? null,
    };
  });
  writeAll(updated);
}

export type UserTicketView = {
  id: string;
  subject: string;
  body: string;
  status: "open" | "answered" | "closed";
  adminReply: string | null;
  createdAt: number;
  source: "cloud" | "local";
};

function normalizeStatus(status: string): UserTicketView["status"] {
  if (status === "answered" || status === "closed") return status;
  return "open";
}

export function mergeTicketsForUser(
  local: LocalSupportTicket[],
  remote: RemoteSupportTicket[],
  wallet: string | null,
  username: string | null,
): UserTicketView[] {
  const walletKey = wallet?.toLowerCase();
  const userKey = username?.toLowerCase();

  const mineLocal = local.filter(
    (t) =>
      (walletKey && t.walletAddress?.toLowerCase() === walletKey)
      || (userKey && t.username?.toLowerCase() === userKey),
  );

  const mineRemote = remote.filter(
    (t) =>
      (walletKey && t.wallet_address?.toLowerCase() === walletKey)
      || (userKey && t.username?.toLowerCase() === userKey),
  );

  const seen = new Set<string>();
  const merged: UserTicketView[] = [];

  for (const r of mineRemote) {
    seen.add(r.id);
    merged.push({
      id: r.id,
      subject: r.subject,
      body: r.body,
      status: normalizeStatus(r.status),
      adminReply: r.admin_reply ?? null,
      createdAt: Date.parse(r.created_at),
      source: "cloud",
    });
  }

  for (const l of mineLocal) {
    if (l.remoteId && seen.has(l.remoteId)) continue;
    merged.push({
      id: l.remoteId ?? l.id,
      subject: l.subject,
      body: l.body,
      status: l.status,
      adminReply: l.adminReply ?? null,
      createdAt: l.createdAt,
      source: l.synced ? "cloud" : "local",
    });
  }

  return merged.sort((a, b) => b.createdAt - a.createdAt);
}