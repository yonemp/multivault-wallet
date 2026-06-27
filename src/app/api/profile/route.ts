import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("primary_address", address)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      primaryAddress?: string;
      displayName?: string;
      avatarColor?: string;
    };

    if (!body.primaryAddress) {
      return NextResponse.json({ error: "primaryAddress required" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          primary_address: body.primaryAddress,
          display_name: body.displayName ?? null,
          avatar_color: body.avatarColor ?? "#2f6fed",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "primary_address" },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}