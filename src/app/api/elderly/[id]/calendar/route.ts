import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";

const MonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export interface CalendarSession {
  id: string;
  started_at: string;
  duration_seconds: number | null;
  mood: string | null;
  summary: string | null;
  topics_discussed: string[];
}

export interface CalendarDay {
  date: string;
  sessions: CalendarSession[];
  maxAlertLevel: number | null;
}

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
  const month = searchParams.get("month");
  const parsedMonth = MonthSchema.safeParse(month);

  if (!parsedMonth.success) {
    return NextResponse.json(
      { error: "El parámetro month debe tener el formato YYYY-MM" },
      { status: 400 }
    );
  }

  const [year, monthNum] = parsedMonth.data.split("-").map(Number);
  const rangeStart = new Date(Date.UTC(year, monthNum - 1, 1)).toISOString();
  const rangeEnd = new Date(Date.UTC(year, monthNum, 1)).toISOString();

  const [{ data: sessions, error: sessionsError }, { data: alerts }] =
    await Promise.all([
      supabase
        .from("conversation_sessions")
        .select(
          "id, started_at, duration_seconds, mood, call_summaries(summary, mood_detected, topics_discussed)"
        )
        .eq("elderly_id", id)
        .gte("started_at", rangeStart)
        .lt("started_at", rangeEnd)
        .order("started_at", { ascending: true }),
      supabase
        .from("alerts")
        .select("alert_level, created_at")
        .eq("elderly_id", id)
        .gte("created_at", rangeStart)
        .lt("created_at", rangeEnd),
    ]);

  if (sessionsError) {
    return NextResponse.json(
      { error: "No se pudo cargar el calendario" },
      { status: 500 }
    );
  }

  const days: Record<string, CalendarDay> = {};

  function dayKey(iso: string): string {
    return iso.slice(0, 10);
  }

  for (const session of sessions ?? []) {
    const key = dayKey(session.started_at);
    if (!days[key]) {
      days[key] = { date: key, sessions: [], maxAlertLevel: null };
    }
    const summary = session.call_summaries[0];
    days[key].sessions.push({
      id: session.id,
      started_at: session.started_at,
      duration_seconds: session.duration_seconds,
      mood: summary?.mood_detected ?? session.mood,
      summary: summary?.summary ?? null,
      topics_discussed: summary?.topics_discussed ?? [],
    });
  }

  for (const alert of alerts ?? []) {
    const key = dayKey(alert.created_at);
    if (!days[key]) {
      days[key] = { date: key, sessions: [], maxAlertLevel: null };
    }
    days[key].maxAlertLevel = Math.max(
      days[key].maxAlertLevel ?? 0,
      alert.alert_level
    );
  }

  return NextResponse.json({ days: Object.values(days) });
}
