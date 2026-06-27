import {
  saveLocalProfile,
  loadLocalProfile,
  type ProfileVisibility,
} from "@/lib/platform/user-profile";
import { normalizeUsername, validateUsername } from "@/lib/platform/username";

const ACCOUNT_USERNAME_KEY = "mv_account_username";

function readProfiles(): Record<string, { displayName?: string }> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("mv_user_profiles") ?? "{}") as Record<
      string,
      { displayName?: string }
    >;
  } catch {
    return {};
  }
}

export function getAccountUsername(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(ACCOUNT_USERNAME_KEY);
  if (stored?.trim()) return normalizeUsername(stored);

  for (const profile of Object.values(readProfiles())) {
    if (profile.displayName?.trim()) {
      return normalizeUsername(profile.displayName);
    }
  }
  return null;
}

export function setAccountUsername(username: string) {
  localStorage.setItem(ACCOUNT_USERNAME_KEY, normalizeUsername(username));
}

export function hasAccountUsername(): boolean {
  return Boolean(getAccountUsername());
}

export async function saveUsernameForWallet(
  primaryAddress: string,
  username: string,
  avatarColor = "#526fff",
  profileVisibility: ProfileVisibility = "public",
): Promise<void> {
  const err = validateUsername(username);
  if (err) throw new Error(err);

  const normalized = normalizeUsername(username);

  const check = await fetch(
    `/api/profile/check?username=${encodeURIComponent(normalized)}`,
  );
  if (check.ok) {
    const data = (await check.json()) as { available?: boolean };
    if (data.available === false) {
      throw new Error("Username is already taken");
    }
  }

  setAccountUsername(normalized);
  saveLocalProfile({
    primaryAddress,
    displayName: normalized,
    avatarColor,
    profileVisibility,
  });

  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      primaryAddress,
      displayName: normalized,
      username: normalized,
      avatarColor,
      profileVisibility,
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to save username");
  }
}

export function profileUsernameForAddress(address: string): string | null {
  const local = loadLocalProfile(address);
  if (local?.displayName?.trim()) return normalizeUsername(local.displayName);
  return getAccountUsername();
}