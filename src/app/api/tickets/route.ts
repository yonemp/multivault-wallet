import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type TicketRecord = {
  id: string;
  wallet_address: string | null;
  chain: string | null;
  subject: string;
  body: string;
  status: string;
  created_at: string;
};

function isMissingTicketsTable(message: string) {
  return message.includes("support_tickets");
}

function fallbackTicket(body: {
  walletAddress?: string;
  chain?: string;
  username?: string;
  subject: string;
  body: string;
}): TicketRecord {
  const ticket: TicketRecord = {
    id: `pending-${Date.now()}`,
    wallet_address: body.walletAddress ?? null,
    chain: body.chain ?? null,
    subject: body.subject,
    body: body.body,
    status: "open",
    created_at: new Date().toISOString(),
  };
  console.error("[support-ticket-fallback]", JSON.stringify(ticket));
  return ticket;
}

async function fetchTicketsFromDb(filters?: { wallet?: string; username?: string }) {
  const supabase = createServerClient();
  let query = supabase.from("support_tickets").select("*").order("created_at", { ascending: false });

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

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        wallet_address: body.walletAddress ?? null,
        chain: body.chain ?? null,
        username: body.username?.trim().toLowerCase() ?? null,
        subject: body.subject.trim(),
        body: body.body.trim(),
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
          body: body.body.trim(),
        });
        return NextResponse.json({ ticket, synced: false, setupRequired: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket: data, synced: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { error: "Admin not configured — set ADMIN_SECRET in Vercel env" },
      { status: 503 },
    );
  }
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    id?: string;
    status?: string;
    adminReply?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Ticket id required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .update({
      status: body.status,
      admin_reply: body.adminReply,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ticket: data });
}