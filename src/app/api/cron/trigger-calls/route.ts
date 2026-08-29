import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getQstashClient } from "@/lib/qstash";

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

// Converts a Madrid wall-clock hour on a given calendar date into the
// absolute UTC instant it represents, correctly accounting for whatever
// DST offset applies on that specific date (no hardcoded +1/+2). Standard
// "guess as UTC, measure the error via the timezone, correct" trick since
// there is no first-party UTC-from-zoned-wall-clock API in this runtime.
function madridDateAtHour(dateKey: string, hour: number): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  const { hour: shownHour } = getMadridDateHour(guess);
  const diffHours = shownHour - hour;
  return new Date(guess.getTime() - diffHours * 60 * 60 * 1000);
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

// Both "active" and "trialing" subscriptions get daily calls — a family in
// their trial period still expects the calls to happen, not just billing.
const SCHEDULABLE_STATUSES = ["active", "trialing"];

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "Falta configurar NEXT_PUBLIC_APP_URL" },
      { status: 500 }
    );
  }

  const supabase = createServiceRoleClient();
  const qstash = getQstashClient();
  const now = new Date();
  const { dateKey: todayKey } = getMadridDateHour(now);

  const { data: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select(
      "elderly_id, calls_per_day, elderly_profiles(id, name, active, preferred_call_time)"
    )
    .in("status", SCHEDULABLE_STATUSES)
    .returns<ActiveSubscriptionRow[]>();

  const seenElderlyIds = new Set<string>();
  const scheduled: Array<{ elderlyId: string; name: string; at: string }> = [];
  const skipped: Array<{ elderlyId: string; name: string; reason: string }> =
    [];

  // This run's only job is to plan today: for every eligible profile, work
  // out every call slot due today (one for Esencial, two spaced apart for
  // Completo) and hand each one to QStash as a delayed callback aimed at
  // /api/calls/scheduled-trigger. Nothing here calls Retell directly —
  // Vercel Hobby's cron can only fire once a day, so a single run cannot
  // itself wait around for each family's preferred hour; QStash is what
  // actually places the call later, at the right instant, without this
  // function staying alive. The deduplication id (elderlyId+date+hour)
  // makes rerunning this route safe: re-scheduling an already-scheduled
  // slot is a no-op on QStash's side, not a duplicate call.
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

    for (const hour of scheduledHours) {
      const targetDate = madridDateAtHour(todayKey, hour);
      const notBefore = Math.floor(targetDate.getTime() / 1000);

      try {
        await qstash.publishJSON({
          url: `${appUrl}/api/calls/scheduled-trigger`,
          body: { elderlyId: profile.id },
          notBefore,
          deduplicationId: `${profile.id}-${todayKey}-${hour}`,
        });
        scheduled.push({
          elderlyId: profile.id,
          name: profile.name,
          at: targetDate.toISOString(),
        });
      } catch (error) {
        skipped.push({
          elderlyId: profile.id,
          name: profile.name,
          reason:
            error instanceof Error
              ? `no se pudo programar: ${error.message}`
              : "no se pudo programar la llamada",
        });
      }
    }
  }

  return NextResponse.json({
    plannedAt: now.toISOString(),
    dateKey: todayKey,
    scheduledCount: scheduled.length,
    skippedCount: skipped.length,
    scheduled,
    skipped,
  });
}
