import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildProfileRow,
  isMissingProfileColumn,
  type ProfileUpsertInput,
} from "@/lib/supabase/profile-schema";

export async function upsertUserProfile(
  supabase: SupabaseClient,
  input: ProfileUpsertInput,
) {
  const fullRow = buildProfileRow(input, { extended: true });
  const result = await supabase
    .from("user_profiles")
    .upsert(fullRow, { onConflict: "primary_address" })
    .select()
    .single();

  if (!result.error) return result;

  if (
    isMissingProfileColumn(result.error.message)
    && (input.email !== undefined
      || input.phone !== undefined
      || input.profileVisibility)
  ) {
    const baseRow = buildProfileRow(input, { extended: false });
    return supabase
      .from("user_profiles")
      .upsert(baseRow, { onConflict: "primary_address" })
      .select()
      .single();
  }

  return result;
}