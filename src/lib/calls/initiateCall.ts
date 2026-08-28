import type { SupabaseClient } from "@supabase/supabase-js";
import { createRetellAgent, makeCall } from "@/lib/phone/retell";
import type { ElderlyPhoto, ElderlyProfile, Memory } from "@/types";

export type InitiateCallResult =
  | { ok: true; callId: string; sessionId: string }
  | { ok: false; error: string };

export async function initiateCallForElderly(
  supabase: SupabaseClient,
  elderlyId: string
): Promise<InitiateCallResult> {
  const { data: profile, error: profileError } = await supabase
    .from("elderly_profiles")
    .select("*")
    .eq("id", elderlyId)
    .single<ElderlyProfile>();

  if (profileError || !profile) {
    return { ok: false, error: "Perfil no encontrado" };
  }

  const { data: memories } = await supabase
    .from("memories")
    .select("*")
    .eq("elderly_id", elderlyId)
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<Memory[]>();

  const { data: photos } = await supabase
    .from("memories_media")
    .select("*")
    .eq("elderly_id", elderlyId)
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<ElderlyPhoto[]>();

  try {
    const { agentId, llmId } = await createRetellAgent(
      profile,
      memories ?? [],
      { agentId: profile.retell_agent_id, llmId: profile.retell_llm_id },
      photos ?? []
    );

    if (
      agentId !== profile.retell_agent_id ||
      llmId !== profile.retell_llm_id
    ) {
      await supabase
        .from("elderly_profiles")
        .update({ retell_agent_id: agentId, retell_llm_id: llmId })
        .eq("id", elderlyId);
    }

    const { callId } = await makeCall(profile.phone_number, agentId, {
      elderly_name: profile.name,
    });

    const { data: session, error: sessionError } = await supabase
      .from("conversation_sessions")
      .insert({
        elderly_id: elderlyId,
        retell_call_id: callId,
        status: "in_progress",
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      return {
        ok: false,
        error: "La llamada se inició pero no se pudo registrar la sesión",
      };
    }

    return { ok: true, callId, sessionId: session.id };
  } catch {
    return { ok: false, error: "No se pudo iniciar la llamada con Retell" };
  }
}
