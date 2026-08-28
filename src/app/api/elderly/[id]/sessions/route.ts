import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await getElderlyAccessRole(supabase, user.id, id);
  if (!role) {
    return NextResponse.json(
      { error: "No tienes acceso a este perfil" },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const { data: sessions, error } = await supabase
    .from("conversation_sessions")
    .select(
      "id, started_at, duration_seconds, call_summaries(summary, mood_detected, topics_discussed)"
    )
    .eq("elderly_id", id)
    .order("started_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cargar el historial" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sessions: sessions ?? [],
    hasMore: (sessions?.length ?? 0) === limit,
  });
}
