import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("connected_wallets")
    .select("is_frozen, frozen_reason, frozen_at")
    .eq("address", address)
    .order("frozen_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.message.includes("is_frozen")) {
      return NextResponse.json({ isFrozen: false, setupRequired: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    isFrozen: Boolean(data?.is_frozen),
    frozenReason: data?.frozen_reason ?? null,
    frozenAt: data?.frozen_at ?? null,
  });
}