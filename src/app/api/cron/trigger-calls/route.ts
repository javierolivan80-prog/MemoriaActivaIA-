import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { initiateCallForElderly } from "@/lib/calls/initiateCall";

const TIMEZONE = "Europe/Madrid";

function getMadridDateHour(date: Date): { dateKey: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  // Some engines format midnight as "24" with hour12: false.
  const hour = map.hour === "24" ? 0 : Number(map.hour);
  return { dateKey: `${map.year}-${map.month}-${map.day}`, hour };
}

function getScheduledHours(
  callsPerDay: number,
  preferredCallTime: string | null
): number[] {
  if (!preferredCallTime) {
    return callsPerDay >= 2 ? [11, 18] : [11];
  }

  const firstHour = Number(preferredCallTime.split(":")[0]);
  if (callsPerDay >= 2) {
    return [firstHour, (firstHour + 7) % 24];
  }
  return [firstHour];
}

interface ActiveSubscriptionRow {
  elderly_id: string;
  calls_per_day: number;
  elderly_profiles: {
    id: string;
    name: string;
    active: boolean;
    preferred_call_time: string | null;
  } | null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date();
  const { dateKey: todayKey, hour: currentHour } = getMadridDateHour(now);

  const { data: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select(
      "elderly_id, calls_per_day, elderly_profiles(id, name, active, preferred_call_time)"
    )
    .eq("status", "active")
    .returns<ActiveSubscriptionRow[]>();

  const seenElderlyIds = new Set<string>();
  const triggered: Array<{ elderlyId: string; name: string; callId: string }> =
    [];
  const skipped: Array<{ elderlyId: string; name: string; reason: string }> =
    [];

  for (const row of activeSubscriptions ?? []) {
    const profile = row.elderly_profiles;
    if (!profile || seenElderlyIds.has(profile.id)) continue;
    seenElderlyIds.add(profile.id);

    if (!profile.active) {
      skipped.push({
        elderlyId: profile.id,
        name: profile.name,
        reason: "perfil inactivo",
      });
      continue;
    }

    const scheduledHours = getScheduledHours(
      row.calls_per_day,
      profile.preferred_call_time
    );

    if (!scheduledHours.includes(currentHour)) {
      skipped.push({
        elderlyId: profile.id,
        name: profile.name,
        reason: `no toca llamar a esta hora (horario: ${scheduledHours.join("h, ")}h, hora actual: ${currentHour}h)`,
      });
      continue;
    }

    // Look back 20h so "today" is covered regardless of UTC/Madrid offset.
    const since = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
    const { data: recentSessions } = await supabase
      .from("conversation_sessions")
      .select("started_at")
      .eq("elderly_id", profile.id)
      .gte("started_at", since);

    const alreadyCalledThisSlot = (recentSessions ?? []).some((session) => {
      const { dateKey, hour } = getMadridDateHour(new Date(session.started_at));
      return dateKey === todayKey && hour === currentHour;
    });

    if (alreadyCalledThisSlot) {
      skipped.push({
        elderlyId: profile.id,
        name: profile.name,
        reason: "ya se llamó en este horario hoy",
      });
      continue;
    }

    const result = await initiateCallForElderly(supabase, profile.id);

    if (result.ok) {
      triggered.push({
        elderlyId: profile.id,
        name: profile.name,
        callId: result.callId,
      });
    } else {
      skipped.push({
        elderlyId: profile.id,
        name: profile.name,
        reason: result.error,
      });
    }
  }

  return NextResponse.json({
    checkedAt: now.toISOString(),
    madridHour: currentHour,
    triggeredCount: triggered.length,
    skippedCount: skipped.length,
    triggered,
    skipped,
  });
}
