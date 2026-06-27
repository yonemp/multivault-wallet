export type UserProfile = {
  primaryAddress: string;
  displayName: string;
  avatarColor: string;
  updatedAt: number;
};

const STORAGE_KEY = "mv_user_profiles";

function readAll(): Record<string, UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, UserProfile>) : {};
  } catch {
    return {};
  }
}

function writeAll(profiles: Record<string, UserProfile>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function loadLocalProfile(address: string): UserProfile | null {
  const key = address.toLowerCase();
  return readAll()[key] ?? null;
}

export function saveLocalProfile(profile: Omit<UserProfile, "updatedAt">): UserProfile {
  const key = profile.primaryAddress.toLowerCase();
  const next: UserProfile = { ...profile, updatedAt: Date.now() };
  const all = readAll();
  all[key] = next;
  writeAll(all);
  return next;
}

export function profileFromApi(
  address: string,
  data: { display_name?: string | null; avatar_color?: string | null; updated_at?: string | null },
): UserProfile {
  return {
    primaryAddress: address,
    displayName: data.display_name ?? "",
    avatarColor: data.avatar_color ?? "#526fff",
    updatedAt: data.updated_at ? Date.parse(data.updated_at) : 0,
  };
}