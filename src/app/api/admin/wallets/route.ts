import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function checkAdmin(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-key") === secret;
}

export async function GET(req: NextRequest) {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { error: "Admin not configured — set ADMIN_SECRET in Vercel env" },
      { status: 503 },
    );
  }
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("connected_wallets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats = {
    total: data?.length ?? 0,
    frozen: data?.filter((w) => w.is_frozen).length ?? 0,
    byChain: {} as Record<string, number>,
    byType: {} as Record<string, number>,
  };

  for (const w of data ?? []) {
    stats.byChain[w.chain] = (stats.byChain[w.chain] ?? 0) + 1;
    stats.byType[w.wallet_type] = (stats.byType[w.wallet_type] ?? 0) + 1;
  }

  return NextResponse.json({ wallets: data, stats });
}

export async function PATCH(req: NextRequest) {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { error: "Admin not configured — set ADMIN_SECRET in Vercel env" },
      { status: 503 },
    );
  }
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    address?: string;
    chain?: string;
    isFrozen?: boolean;
    reason?: string;
    frozenBy?: string;
  };

  if (!body.address || !body.chain) {
    return NextResponse.json({ error: "address and chain required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("connected_wallets")
    .update({
      is_frozen: body.isFrozen ?? false,
      frozen_reason: body.isFrozen ? body.reason ?? "Flagged by admin" : null,
      frozen_at: body.isFrozen ? new Date().toISOString() : null,
      frozen_by: body.isFrozen ? body.frozenBy ?? "admin" : null,
    })
    .eq("address", body.address)
    .eq("chain", body.chain)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ wallet: data });
}