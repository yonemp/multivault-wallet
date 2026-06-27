import {
  appendTicketMessage,
  createTicketMessage,
  normalizeTicketStatus,
  parseTicketMessages,
  type TicketMessage,
  type TicketStatus,
} from "@/lib/platform/ticket-messages";

export type LocalSupportTicket = {
  id: string;
  remoteId?: string | null;
  walletAddress: string | null;
  chain: string | null;
  username: string | null;
  subject: string;
  body: string;
  status: TicketStatus;
  messages: TicketMessage[];
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
  messages?: TicketMessage[] | null;
  created_at: string;
  updated_at?: string | null;
};

const STORAGE_KEY = "mv_support_tickets";

function readAll(): LocalSupportTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as LocalSupportTicket[];
    return raw.map((t) => ({
      ...t,
      messages: t.messages?.length ? t.messages : parseTicketMessages({
        body: t.body,
        created_at: new Date(t.createdAt).toISOString(),
      }),
      status: normalizeTicketStatus(t.status),
    }));
  } catch {
    return [];
  }
}

function writeAll(tickets: LocalSupportTicket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets.slice(-50)));
}

function findTicketIndex(tickets: LocalSupportTicket[], id: string) {
  return tickets.findIndex((t) => t.id === id || t.remoteId === id);
}

export function saveLocalTicket(
  input: Omit<LocalSupportTicket, "id" | "createdAt" | "status" | "synced" | "messages"> & {
    synced?: boolean;
    messages?: TicketMessage[];
  },
): LocalSupportTicket {
  const initialMessage = createTicketMessage("user", input.body);
  const ticket: LocalSupportTicket = {
    id: `local-${Date.now()}`,
    walletAddress: input.walletAddress,
    chain: input.chain,
    username: input.username ?? null,
    subject: input.subject,
    body: input.body,
    status: "open",
    messages: input.messages ?? [initialMessage],
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

export function appendLocalTicketMessage(id: string, role: "user" | "admin", body: string) {
  const all = readAll();
  const idx = findTicketIndex(all, id);
  if (idx < 0) return null;
  const ticket = all[idx];
  const messages = appendTicketMessage(
    { body: ticket.body, messages: ticket.messages, created_at: new Date(ticket.createdAt).toISOString() },
    role,
    body,
  );
  all[idx] = { ...ticket, messages, status: "open" };
  writeAll(all);
  return all[idx];
}

export function closeLocalTicket(id: string) {
  const all = readAll();
  const idx = findTicketIndex(all, id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], status: "closed" };
  writeAll(all);
  return all[idx];
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
      status: normalizeTicketStatus(match.status),
      messages: parseTicketMessages(match),
    };
  });
  writeAll(updated);
}

export type UserTicketView = {
  id: string;
  localId?: string;
  subject: string;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: number;
  source: "cloud" | "local";
  canReply: boolean;
};

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
    const status = normalizeTicketStatus(r.status);
    merged.push({
      id: r.id,
      subject: r.subject,
      status,
      messages: parseTicketMessages(r),
      createdAt: Date.parse(r.created_at),
      source: "cloud",
      canReply: status === "open",
    });
  }

  for (const l of mineLocal) {
    if (l.remoteId && seen.has(l.remoteId)) continue;
    merged.push({
      id: l.remoteId ?? l.id,
      localId: l.id,
      subject: l.subject,
      status: l.status,
      messages: l.messages,
      createdAt: l.createdAt,
      source: l.synced ? "cloud" : "local",
      canReply: l.status === "open",
    });
  }

  return merged.sort((a, b) => b.createdAt - a.createdAt);
}