import { createServiceRoleClient } from "@/lib/supabase/service";

/**
 * Simple fixed-window rate limiter backed by a Postgres table. Returns
 * false (and does not record the attempt) once the caller has hit
 * maxRequests within the trailing windowMinutes for the given action.
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  maxRequests: number,
  windowMinutes: number
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { count } = await supabase
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", since);

  if ((count ?? 0) >= maxRequests) {
    return false;
  }

  await supabase.from("rate_limit_events").insert({ user_id: userId, action });
  return true;
}
