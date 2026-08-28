import type { SupabaseClient } from "@supabase/supabase-js";
import type { ElderlyAccessRole } from "@/types";

export type ElderlyRole = ElderlyAccessRole;

/**
 * Returns the caller's role on an elderly profile, or null if they have no
 * accepted access at all.
 */
export async function getElderlyAccessRole(
  supabase: SupabaseClient,
  userId: string,
  elderlyId: string
): Promise<ElderlyRole | null> {
  const { data } = await supabase
    .from("elderly_profile_access")
    .select("role")
    .eq("elderly_id", elderlyId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  return (data?.role as ElderlyRole | undefined) ?? null;
}
