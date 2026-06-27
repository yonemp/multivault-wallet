import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { normalizeUsername, validateUsername } from "@/lib/platform/username";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("username");
  if (!raw) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const username = normalizeUsername(raw);
  const err = validateUsername(username);
  if (err) {
    return NextResponse.json({ error: err, available: false }, { status: 400 });
  }

  const supabase = createServerClient();

  const byUsername = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!byUsername.error && byUsername.data) {
    return NextResponse.json({ available: false });
  }

  const byDisplay = await supabase
    .from("user_profiles")
    .select("id")
    .ilike("display_name", username)
    .maybeSingle();

  if (!byDisplay.error && byDisplay.data) {
    return NextResponse.json({ available: false });
  }

  return NextResponse.json({ available: true });
}