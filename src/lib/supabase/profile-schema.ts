export const PROFILE_EXTENDED_COLUMNS = ["email", "phone", "profile_visibility"] as const;

export function isMissingProfileColumn(message: string, column?: string): boolean {
  const lower = message.toLowerCase();
  if (!lower.includes("schema cache")) return false;
  if (column) return lower.includes(column.toLowerCase());
  return PROFILE_EXTENDED_COLUMNS.some((c) => lower.includes(c));
}

export type ProfileUpsertInput = {
  primaryAddress: string;
  displayName?: string | null;
  username?: string | null;
  avatarColor?: string;
  email?: string | null;
  phone?: string | null;
  profileVisibility?: "public" | "private";
};

export function buildProfileRow(
  input: ProfileUpsertInput,
  options: { extended: boolean },
): Record<string, string | null> {
  const row: Record<string, string | null> = {
    primary_address: input.primaryAddress,
    display_name: input.username ?? input.displayName?.trim() ?? null,
    avatar_color: input.avatarColor ?? "#2f6fed",
    updated_at: new Date().toISOString(),
  };

  if (input.username) row.username = input.username;

  if (options.extended) {
    if (input.email !== undefined) row.email = input.email?.trim() || null;
    if (input.phone !== undefined) row.phone = input.phone?.trim() || null;
    if (input.profileVisibility) row.profile_visibility = input.profileVisibility;
  }

  return row;
}

export const PROFILE_SELECT_BASE = "username, primary_address, display_name, avatar_color, updated_at";
export const PROFILE_SELECT_EXTENDED = `${PROFILE_SELECT_BASE}, email, phone, profile_visibility`;

export function normalizeProfileVisibility(value: unknown): "public" | "private" {
  return value === "private" ? "private" : "public";
}