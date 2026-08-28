import type { SupabaseClient } from "@supabase/supabase-js";
import type { ElderlyAccessRole } from "@/types";

export type ElderlyRole = ElderlyAccessRole;

/**
 * Returns the caller's role on an elderly profile, or null if they have no
 * access at all. Ownership-only for now; extended to check
 * elderly_profile_access once multi-user sharing lands.
 */
export async function getElderlyAccessRole(
  supabase: SupabaseClient,
  userId: string,
  elderlyId: string
): Promise<ElderlyRole | null> {
  const { data } = await supabase
    .from("elderly_profiles")
    .select("id")
    .eq("id", elderlyId)
    .eq("user_id", userId)
    .maybeSingle();

  return data ? "owner" : null;
}
