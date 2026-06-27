import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isFriendWalletActive } from "@/lib/platform/friend-tracker-sync";
import { normalizeUsername, validateUsername } from "@/lib/platform/username";

type FriendRequestRow = {
  id: string;
  from_username: string;
  to_username: string;
  status: string;
  created_at: string;
  updated_at?: string;
};

function isMissingFriendsTable(message: string) {
  return message.includes("friend_requests");
}

async function lookupProfile(username: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("username, primary_address, updated_at")
    .eq("username", username)
    .maybeSingle();
  return data;
}

async function friendActivity(username: string, primaryAddress: string | null) {
  if (!primaryAddress) {
    return { lastSeenAt: null as string | null, active: false };
  }

  const supabase = createServerClient();
  const { data: wallet } = await supabase
    .from("connected_wallets")
    .select("last_seen_at")
    .eq("address", primaryAddress)
    .eq("chain", "solana")
    .maybeSingle();

  const lastSeenAt =
    wallet?.last_seen_at
    ?? (await lookupProfile(username))?.updated_at
    ?? null;

  return { lastSeenAt, active: isFriendWalletActive(lastSeenAt) };
}

async function buildFriendsList(username: string, rows: FriendRequestRow[]) {
  const me = normalizeUsername(username);
  const accepted = rows.filter(
    (r) =>
      r.status === "accepted"
      && (r.from_username === me || r.to_username === me),
  );

  const friends = [];
  for (const row of accepted) {
    const friendUsername = row.from_username === me ? row.to_username : row.from_username;
    const profile = await lookupProfile(friendUsername);
    const primaryAddress = profile?.primary_address ?? null;
    const activity = await friendActivity(friendUsername, primaryAddress);
    friends.push({
      username: friendUsername,
      primaryAddress,
      lastSeenAt: activity.lastSeenAt,
      active: activity.active,
    });
  }

  return friends;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("username");
  if (!raw) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const username = normalizeUsername(raw);
  const err = validateUsername(username);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*")
    .or(`from_username.eq.${username},to_username.eq.${username}`)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingFriendsTable(error.message)) {
      return NextResponse.json({
        friends: [],
        incoming: [],
        outgoing: [],
        setupRequired: true,
        hint: "Run supabase/schema-v3-friends.sql in Supabase SQL Editor",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as FriendRequestRow[];
  const friends = await buildFriendsList(username, rows);

  return NextResponse.json({
    friends,
    incoming: rows.filter((r) => r.status === "pending" && r.to_username === username),
    outgoing: rows.filter((r) => r.status === "pending" && r.from_username === username),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      fromUsername?: string;
      toUsername?: string;
    };

    const fromUsername = body.fromUsername ? normalizeUsername(body.fromUsername) : "";
    const toUsername = body.toUsername ? normalizeUsername(body.toUsername) : "";

    if (!fromUsername || !toUsername) {
      return NextResponse.json({ error: "fromUsername and toUsername required" }, { status: 400 });
    }
    if (fromUsername === toUsername) {
      return NextResponse.json({ error: "You cannot add yourself" }, { status: 400 });
    }

    const fromErr = validateUsername(fromUsername);
    const toErr = validateUsername(toUsername);
    if (fromErr || toErr) {
      return NextResponse.json({ error: fromErr ?? toErr }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: target, error: targetErr } = await supabase
      .from("user_profiles")
      .select("username, primary_address, profile_visibility")
      .eq("username", toUsername)
      .maybeSingle();

    if (targetErr) {
      if (isMissingFriendsTable(targetErr.message)) {
        return NextResponse.json({ error: "Friends database not configured" }, { status: 503 });
      }
      return NextResponse.json({ error: targetErr.message }, { status: 500 });
    }

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.profile_visibility === "private") {
      return NextResponse.json(
        { error: "This profile is private — they must send you a friend request first" },
        { status: 403 },
      );
    }

    const { data: existingFriends } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("status", "accepted")
      .or(
        `and(from_username.eq.${fromUsername},to_username.eq.${toUsername}),and(from_username.eq.${toUsername},to_username.eq.${fromUsername})`,
      );

    if (existingFriends?.length) {
      return NextResponse.json({ error: "Already friends" }, { status: 409 });
    }

    const { data: reversePending } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("from_username", toUsername)
      .eq("to_username", fromUsername)
      .eq("status", "pending")
      .maybeSingle();

    if (reversePending) {
      const { data: accepted, error: acceptErr } = await supabase
        .from("friend_requests")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", reversePending.id)
        .select()
        .single();

      if (acceptErr) {
        if (isMissingFriendsTable(acceptErr.message)) {
          return NextResponse.json({ error: "Friends database not configured" }, { status: 503 });
        }
        return NextResponse.json({ error: acceptErr.message }, { status: 500 });
      }

      const friends = await buildFriendsList(fromUsername, [accepted as FriendRequestRow]);
      return NextResponse.json({ request: accepted, autoAccepted: true, friends });
    }

    const { data: dup } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("from_username", fromUsername)
      .eq("to_username", toUsername)
      .neq("status", "declined")
      .maybeSingle();

    if (dup) {
      return NextResponse.json({ error: "Friend request already sent" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("friend_requests")
      .upsert(
        {
          from_username: fromUsername,
          to_username: toUsername,
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "from_username,to_username" },
      )
      .select()
      .single();

    if (error) {
      if (isMissingFriendsTable(error.message)) {
        return NextResponse.json({ error: "Friends database not configured" }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?: "accept" | "decline" | "remove";
      requestId?: string;
      username?: string;
      friendUsername?: string;
    };

    const username = body.username ? normalizeUsername(body.username) : "";
    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    const supabase = createServerClient();

    if (body.action === "remove") {
      const friend = body.friendUsername ? normalizeUsername(body.friendUsername) : "";
      if (!friend) return NextResponse.json({ error: "friendUsername required" }, { status: 400 });

      const { data: rows, error: findErr } = await supabase
        .from("friend_requests")
        .select("id")
        .eq("status", "accepted")
        .or(
          `and(from_username.eq.${username},to_username.eq.${friend}),and(from_username.eq.${friend},to_username.eq.${username})`,
        );

      if (findErr) {
        if (isMissingFriendsTable(findErr.message)) {
          return NextResponse.json({ error: "Friends database not configured" }, { status: 503 });
        }
        return NextResponse.json({ error: findErr.message }, { status: 500 });
      }

      const ids = (rows ?? []).map((r) => r.id);
      if (!ids.length) return NextResponse.json({ ok: true });

      const { error } = await supabase.from("friend_requests").delete().in("id", ids);

      if (error) {
        if (isMissingFriendsTable(error.message)) {
          return NextResponse.json({ error: "Friends database not configured" }, { status: 503 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (!body.requestId || !body.action) {
      return NextResponse.json({ error: "requestId and action required" }, { status: 400 });
    }

    const status = body.action === "accept" ? "accepted" : "declined";
    const { data, error } = await supabase
      .from("friend_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", body.requestId)
      .eq("to_username", username)
      .eq("status", "pending")
      .select()
      .single();

    if (error) {
      if (isMissingFriendsTable(error.message)) {
        return NextResponse.json({ error: "Friends database not configured" }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const friends =
      status === "accepted"
        ? await buildFriendsList(username, [data as FriendRequestRow])
        : [];

    return NextResponse.json({ request: data, friends });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}