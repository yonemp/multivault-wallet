import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { normalizeProfileVisibility } from "@/lib/supabase/profile-schema";
import { upsertUserProfile } from "@/lib/supabase/profile-upsert";
import { normalizeUsername, validateUsername } from "@/lib/platform/username";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const usernameParam = req.nextUrl.searchParams.get("username");

  if (!address && !usernameParam) {
    return NextResponse.json({ error: "address or username required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const query = supabase.from("user_profiles").select("*");

  const { data, error } = usernameParam
    ? await query.eq("username", normalizeUsername(usernameParam)).maybeSingle()
    : await query.eq("primary_address", address!).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ profile: null });
  }

  if (normalizeProfileVisibility(data.profile_visibility) === "private" && usernameParam) {
    return NextResponse.json({
      profile: {
        username: data.username,
        profile_visibility: "private",
        display_name: data.display_name,
        avatar_color: data.avatar_color,
      },
    });
  }

  return NextResponse.json({ profile: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      primaryAddress?: string;
      displayName?: string;
      username?: string;
      avatarColor?: string;
      email?: string | null;
      phone?: string | null;
      profileVisibility?: "public" | "private";
    };

    if (!body.primaryAddress) {
      return NextResponse.json({ error: "primaryAddress required" }, { status: 400 });
    }

    const username = body.username
      ? normalizeUsername(body.username)
      : body.displayName
        ? normalizeUsername(body.displayName)
        : null;

    if (username) {
      const validationError = validateUsername(username);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const supabase = createServerClient();
      const takenUsername = await supabase
        .from("user_profiles")
        .select("primary_address")
        .eq("username", username)
        .neq("primary_address", body.primaryAddress)
        .maybeSingle();

      if (!takenUsername.error && takenUsername.data) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
      }

      const takenDisplay = await supabase
        .from("user_profiles")
        .select("primary_address")
        .ilike("display_name", username)
        .neq("primary_address", body.primaryAddress)
        .maybeSingle();

      if (!takenDisplay.error && takenDisplay.data) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
      }
    }

    const supabase = createServerClient();
    const { data, error } = await upsertUserProfile(supabase, {
      primaryAddress: body.primaryAddress,
      displayName: body.displayName,
      username,
      avatarColor: body.avatarColor,
      email: body.email,
      phone: body.phone,
      profileVisibility: body.profileVisibility,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}