import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRetellAgent, makeCall } from "@/lib/phone/retell";
import type { ElderlyProfile, Memory } from "@/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const elderlyId = body?.elderlyId;

  if (typeof elderlyId !== "string" || !elderlyId) {
    return NextResponse.json(
      { error: "El campo elderlyId es obligatorio" },
      { status: 400 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("elderly_profiles")
    .select("*")
    .eq("id", elderlyId)
    .eq("user_id", user.id)
    .single<ElderlyProfile>();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Perfil no encontrado" },
      { status: 404 }
    );
  }

  const { data: memories } = await supabase
    .from("memories")
    .select("*")
    .eq("elderly_id", elderlyId)
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<Memory[]>();

  try {
    const { agentId, llmId } = await createRetellAgent(
      profile,
      memories ?? [],
      { agentId: profile.retell_agent_id, llmId: profile.retell_llm_id }
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
      .select("*")
      .single();

    if (sessionError) {
      return NextResponse.json(
        { error: "La llamada se inició pero no se pudo registrar la sesión" },
        { status: 500 }
      );
    }

    return NextResponse.json({ callId, session });
  } catch {
    return NextResponse.json(
      { error: "No se pudo iniciar la llamada con Retell" },
      { status: 502 }
    );
  }
}
