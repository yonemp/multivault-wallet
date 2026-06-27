export type TicketMessageRole = "user" | "admin";

export type TicketMessage = {
  id: string;
  role: TicketMessageRole;
  body: string;
  created_at: string;
};

export type TicketStatus = "open" | "closed";

type TicketLike = {
  body: string;
  admin_reply?: string | null;
  messages?: TicketMessage[] | null;
  created_at: string;
  updated_at?: string | null;
  status?: string | null;
};

export function createTicketMessage(role: TicketMessageRole, body: string): TicketMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    body,
    created_at: new Date().toISOString(),
  };
}

export function parseTicketMessages(ticket: TicketLike): TicketMessage[] {
  if (Array.isArray(ticket.messages) && ticket.messages.length > 0) {
    return ticket.messages.map((m) => ({
      id: m.id,
      role: m.role,
      body: m.body,
      created_at: m.created_at,
    }));
  }

  const messages: TicketMessage[] = [
    {
      id: "initial",
      role: "user",
      body: ticket.body,
      created_at: ticket.created_at,
    },
  ];

  if (ticket.admin_reply?.trim()) {
    messages.push({
      id: "legacy-admin",
      role: "admin",
      body: ticket.admin_reply.trim(),
      created_at: ticket.updated_at ?? ticket.created_at,
    });
  }

  return messages;
}

export function normalizeTicketStatus(status: string | null | undefined): TicketStatus {
  return status === "closed" ? "closed" : "open";
}

export function appendTicketMessage(
  ticket: TicketLike,
  role: TicketMessageRole,
  body: string,
): TicketMessage[] {
  return [...parseTicketMessages(ticket), createTicketMessage(role, body)];
}

export function ticketBelongsToUser(
  ticket: { wallet_address?: string | null; username?: string | null },
  wallet?: string | null,
  username?: string | null,
): boolean {
  const walletKey = wallet?.trim();
  const userKey = username?.trim().toLowerCase();
  if (walletKey && ticket.wallet_address === walletKey) return true;
  if (userKey && ticket.username?.toLowerCase() === userKey) return true;
  return false;
}