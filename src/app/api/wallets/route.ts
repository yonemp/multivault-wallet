import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("connected_wallets")
      .select("id, address, chain, wallet_type, last_seen_at, created_at")
      .order("last_seen_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ wallets: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed to load wallets" }, { status: 500 });
  }
}