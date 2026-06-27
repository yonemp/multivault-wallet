export type LocalSupportTicket = {
  id: string;
  walletAddress: string | null;
  chain: string | null;
  subject: string;
  body: string;
  status: "open" | "answered" | "closed";
  createdAt: number;
  synced: boolean;
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

export function markTicketSynced(id: string) {
  writeAll(
    readAll().map((t) => (t.id === id ? { ...t, synced: true } : t)),
  );
}