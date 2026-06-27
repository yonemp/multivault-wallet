import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  appendTicketMessage,
  createTicketMessage,
  normalizeTicketStatus,
  parseTicketMessages,
  ticketBelongsToUser,
  type TicketMessage,
} from "@/lib/platform/ticket-messages";

type TicketRecord = {
  id: string;
  wallet_address: string | null;
  chain: string | null;
  username: string | null;
  subject: string;
  body: string;
  status: string;
  messages: TicketMessage[];
  created_at: string;
};

function isMissingTicketsTable(message: string) {
  return message.includes("support_tickets");
}

function isMissingMessagesColumn(message: string) {
  return message.includes("messages") && message.includes("schema cache");
}

function fallbackTicket(body: {
  walletAddress?: string;
  chain?: string;
  username?: string;
  subject: string;
  body: string;
}): TicketRecord {
  const created = new Date().toISOString();
  const ticket: TicketRecord = {
    id: `pending-${Date.now()}`,
    wallet_address: body.walletAddress ?? null,
    chain: body.chain ?? null,
    username: body.username?.trim().toLowerCase() ?? null,
    subject: body.subject,
    body: body.body,
    status: "open",
    messages: [createTicketMessage("user", body.body)],
    created_at: created,
  };
  console.error("[support-ticket-fallback]", JSON.stringify(ticket));
  return ticket;
}

async function fetchTicketsFromDb(filters?: { wallet?: string; username?: string }) {
  const supabase = createServerClient();
  let query = supabase.from("support_tickets").select("*").order("updated_at", { ascending: false });

  if (filters?.wallet && filters?.username) {
    query = query.or(
      `wallet_address.eq.${filters.wallet},username.eq.${filters.username}`,
    );
  } else if (filters?.wallet) {
    query = query.eq("wallet_address", filters.wallet);
  } else if (filters?.username) {
    query = query.eq("username", filters.username);
  }

  return query;
}

async function loadTicketById(id: string) {
  const supabase = createServerClient();
  return supabase.from("support_tickets").select("*").eq("id", id).single();
}

async function updateTicket(
  id: string,
  patch: Record<string, unknown>,
) {
  const supabase = createServerClient();
  return supabase
    .from("support_tickets")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
}

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  const isAdmin = Boolean(
    process.env.ADMIN_SECRET && adminKey === process.env.ADMIN_SECRET,
  );

  const wallet = req.nextUrl.searchParams.get("wallet")?.trim() || undefined;
  const username = req.nextUrl.searchParams.get("username")?.trim().toLowerCase() || undefined;

  if (!isAdmin) {
    if (!wallet && !username) {
      return NextResponse.json({ error: "wallet or username required" }, { status: 400 });
    }
  } else if (!process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { error: "Admin not configured — set ADMIN_SECRET in Vercel env" },
      { status: 503 },
    );
  }

  const { data, error } = await fetchTicketsFromDb(isAdmin ? undefined : { wallet, username });

  if (error) {
    if (isMissingTicketsTable(error.message)) {
      return NextResponse.json({
        tickets: [],
        setupRequired: true,
        hint: "Run supabase/schema-v2.sql in the Supabase SQL Editor",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tickets: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      walletAddress?: string;
      chain?: string;
      username?: string;
      subject?: string;
      body?: string;
    };

    if (!body.subject?.trim() || !body.body?.trim()) {
      return NextResponse.json({ error: "Subject and body required" }, { status: 400 });
    }

    const initialBody = body.body.trim();
    const messages = [createTicketMessage("user", initialBody)];

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        wallet_address: body.walletAddress ?? null,
        chain: body.chain ?? null,
        username: body.username?.trim().toLowerCase() ?? null,
        subject: body.subject.trim(),
        body: initialBody,
        status: "open",
        messages,
      })
      .select()
      .single();

    if (error) {
      if (isMissingTicketsTable(error.message)) {
        const ticket = fallbackTicket({
          walletAddress: body.walletAddress,
          chain: body.chain,
          username: body.username,
          subject: body.subject.trim(),
          body: initialBody,
        });
        return NextResponse.json({ ticket, synced: false, setupRequired: true });
      }
      if (isMissingMessagesColumn(error.message)) {
        const { data: legacy, error: legacyErr } = await supabase
          .from("support_tickets")
          .insert({
            wallet_address: body.walletAddress ?? null,
            chain: body.chain ?? null,
            username: body.username?.trim().toLowerCase() ?? null,
            subject: body.subject.trim(),
            body: initialBody,
            status: "open",
          })
          .select()
          .single();
        if (legacyErr) {
          return NextResponse.json({ error: legacyErr.message }, { status: 500 });
        }
        return NextResponse.json({ ticket: legacy, synced: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket: data, synced: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminKey = req.headers.get("x-admin-key");
    const isAdmin = Boolean(
      process.env.ADMIN_SECRET && adminKey === process.env.ADMIN_SECRET,
    );

    const body = (await req.json()) as {
      id?: string;
      action?: "message" | "close";
      body?: string;
      wallet?: string;
      username?: string;
      /** @deprecated use action:message */
      status?: string;
      /** @deprecated use action:message */
      adminReply?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Ticket id required" }, { status: 400 });
    }

    const action =
      body.action
      ?? (body.adminReply ? "message" : body.status === "closed" ? "close" : undefined);

    if (!action) {
      return NextResponse.json({ error: "action required" }, { status: 400 });
    }

    const { data: ticket, error: fetchErr } = await loadTicketById(body.id);
    if (fetchErr) {
      if (isMissingTicketsTable(fetchErr.message)) {
        return NextResponse.json({ error: "Support database not configured" }, { status: 503 });
      }
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (normalizeTicketStatus(ticket.status) === "closed") {
      return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });
    }

    if (!isAdmin) {
      if (!ticketBelongsToUser(ticket, body.wallet, body.username)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (action !== "message" && action !== "close") {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
    }

    if (action === "close") {
      const { data, error } = await updateTicket(body.id, { status: "closed" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ticket: data });
    }

    const messageBody = (body.body ?? body.adminReply)?.trim();
    if (!messageBody) {
      return NextResponse.json({ error: "Message body required" }, { status: 400 });
    }

    const role = isAdmin ? "admin" : "user";
    const messages = appendTicketMessage(ticket, role, messageBody);

    const patch: Record<string, unknown> = {
      status: "open",
      messages,
    };
    if (role === "admin") {
      patch.admin_reply = messageBody;
    }

    const { data, error } = await updateTicket(body.id, patch);
    if (error) {
      if (isMissingMessagesColumn(error.message)) {
        if (!isAdmin) {
          return NextResponse.json({ error: "Run schema-v3 migration for threaded tickets" }, { status: 503 });
        }
        const { data: legacy, error: legacyErr } = await updateTicket(body.id, {
          status: "open",
          admin_reply: messageBody,
        });
        if (legacyErr) return NextResponse.json({ error: legacyErr.message }, { status: 500 });
        return NextResponse.json({ ticket: legacy });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}