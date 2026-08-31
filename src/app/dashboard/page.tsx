import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle, Clock, PhoneCall, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";
import AlertsPanel, { type AlertItem } from "@/components/dashboard/AlertsPanel";
import AttachFamilyPlanButton from "@/components/dashboard/AttachFamilyPlanButton";
import ManageSubscriptionButton from "@/components/dashboard/ManageSubscriptionButton";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";
import { MAX_FAMILY_MEMBERS, PLANS } from "@/lib/stripe/plans";
import type { ElderlyProfile, Subscription, SubscriptionMember } from "@/types";

interface AlertRow {
  id: string;
  message: string;
  alert_level: 1 | 2 | 3;
  created_at: string;
  elderly_profiles: { name: string } | null;
}

interface RecentSessionRow {
  id: string;
  elderly_id: string;
  status: string;
  started_at: string;
  call_summaries: { id: string }[];
  elderly_profiles: { name: string } | null;
}

interface LatestCallRow {
  elderly_id: string;
  started_at: string;
  call_summaries: { summary: string; mood_detected: string | null }[];
}

interface CallIssue {
  elderlyId: string;
  name: string;
  kind: "failed" | "no_answer" | "processing" | "analysis_failed";
}

const CALL_ISSUE_COPY: Record<
  CallIssue["kind"],
  { icon: typeof AlertCircle; tone: "warning" | "info"; message: (name: string) => string }
> = {
  failed: {
    icon: AlertCircle,
    tone: "warning",
    message: (name) =>
      `La llamada a ${name} no se pudo completar. Lo intentaremos de nuevo en el próximo horario.`,
  },
  no_answer: {
    icon: AlertCircle,
    tone: "warning",
    message: (name) =>
      `${name} no contestó a la llamada de hoy. Lo intentaremos de nuevo en el próximo horario.`,
  },
  processing: {
    icon: Clock,
    tone: "info",
    message: (name) =>
      `Estamos terminando de procesar la última llamada a ${name}. El resumen aparecerá en breve.`,
  },
  analysis_failed: {
    icon: AlertCircle,
    tone: "warning",
    message: (name) =>
      `La llamada a ${name} se completó, pero no pudimos generar un resumen esta vez.`,
  },
};

// The product is Spain-only (see PRODUCT.md), so a fixed timezone for the
// greeting and "when they spoke" phrasing is a real constraint, not a guess.
const TZ = "Europe/Madrid";

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function minutesSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 60_000;
}

function madridParts(date: Date) {
  const parts = new Intl.DateTimeFormat("es-ES", {
    timeZone: TZ,
    hour: "numeric",
    hour12: false,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { hour: get("hour"), year: get("year"), month: get("month"), day: get("day") };
}

function greeting(): string {
  const { hour } = madridParts(new Date());
  if (hour < 6) return "Buenas noches";
  if (hour < 13) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

function daysBetween(a: ReturnType<typeof madridParts>, b: ReturnType<typeof madridParts>) {
  const da = Date.UTC(a.year, a.month - 1, a.day);
  const db = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((db - da) / 86_400_000);
}

const WEEKDAYS = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];

// "esta mañana" / "ayer" / "el martes" — the same relative-day phrasing the
// brief's own mockup uses, instead of a bare timestamp.
function whenSpoke(iso: string): string {
  const when = new Date(iso);
  const nowParts = madridParts(new Date());
  const whenParts = madridParts(when);
  const diffDays = daysBetween(whenParts, nowParts);

  if (diffDays === 0) {
    if (whenParts.hour < 13) return "esta mañana";
    if (whenParts.hour < 20) return "esta tarde";
    return "esta noche";
  }
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `el ${WEEKDAYS[when.getDay()]}`;
  return `el ${when.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}`;
}

const MOOD_CLOSING: Record<string, string> = {
  positivo: "Todo parece tranquilo.",
  neutral: "Un día normal, sin nada que destacar.",
  negativo: "Ha estado un poco bajo de ánimo. Puede que le venga bien que le llames tú también.",
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  trialing: "En periodo de prueba",
  past_due: "Pago pendiente",
  payment_failed: "Pago fallido",
  canceled: "Cancelada",
  incomplete: "Incompleta",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const displayName =
    (user.user_metadata?.name as string | undefined) ?? user.email ?? "";

  const since48h = isoHoursAgo(48);
  const since14d = isoHoursAgo(24 * 14);

  const [
    profilesResult,
    alertsResult,
    subscriptionsResult,
    recentSessionsResult,
    latestCallsResult,
    subscriptionMembersResult,
  ] = await Promise.all([
    supabase
      .from("elderly_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<ElderlyProfile[]>(),
    supabase
      .from("alerts")
      .select("id, message, alert_level, created_at, elderly_profiles(name)")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .returns<AlertRow[]>(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<Subscription[]>(),
    supabase
      .from("conversation_sessions")
      .select("id, elderly_id, status, started_at, call_summaries(id), elderly_profiles(name)")
      .gte("started_at", since48h)
      .order("started_at", { ascending: false })
      .returns<RecentSessionRow[]>(),
    supabase
      .from("conversation_sessions")
      .select("elderly_id, started_at, call_summaries(summary, mood_detected)")
      .eq("status", "completed")
      .gte("started_at", since14d)
      .order("started_at", { ascending: false })
      .returns<LatestCallRow[]>(),
    // RLS already scopes this to subscriptions the caller owns, so no
    // explicit user_id filter is needed here.
    supabase
      .from("subscription_members")
      .select("subscription_id, elderly_id")
      .returns<Pick<SubscriptionMember, "subscription_id" | "elderly_id">[]>(),
  ]);

  const profiles = profilesResult.data;
  const hasProfiles = (profiles?.length ?? 0) > 0;

  const alerts: AlertItem[] = (alertsResult.data ?? []).map((row) => ({
    id: row.id,
    message: row.message,
    alert_level: row.alert_level,
    created_at: row.created_at,
    elderly_name: row.elderly_profiles?.name ?? "Familiar",
  }));

  const latestSubscriptionByElderly = new Map<string, Subscription>();
  for (const subscription of subscriptionsResult.data ?? []) {
    if (subscription.elderly_id && !latestSubscriptionByElderly.has(subscription.elderly_id)) {
      latestSubscriptionByElderly.set(subscription.elderly_id, subscription);
    }
  }

  // A "familiar" subscription covers whichever profiles are listed in
  // subscription_members rather than pointing at one elderly_id — resolve
  // that indirection so the rest of the page can treat a family-covered
  // profile exactly like one with its own individual subscription.
  const familySubscription = (subscriptionsResult.data ?? []).find(
    (s) => s.plan_type === "familiar" && ACTIVE_STATUSES.has(s.status)
  );
  const familyMemberElderlyIds = new Set(
    (subscriptionMembersResult.data ?? [])
      .filter((m) => m.subscription_id === familySubscription?.id)
      .map((m) => m.elderly_id)
  );
  for (const elderlyId of familyMemberElderlyIds) {
    if (familySubscription && !latestSubscriptionByElderly.has(elderlyId)) {
      latestSubscriptionByElderly.set(elderlyId, familySubscription);
    }
  }
  const familyHasRoom = Boolean(
    familySubscription && familyMemberElderlyIds.size < MAX_FAMILY_MEMBERS
  );

  const latestCallByElderly = new Map<string, LatestCallRow>();
  for (const row of latestCallsResult.data ?? []) {
    if (row.call_summaries.length === 0) continue;
    if (!latestCallByElderly.has(row.elderly_id)) {
      latestCallByElderly.set(row.elderly_id, row);
    }
  }

  // Surface calls that failed, went unanswered, or finished but still have
  // no summary after a while — otherwise "no alerts" looks identical to
  // "we never actually checked in", which is exactly what a worried family
  // member must never be left wondering about.
  const callIssueByElderly = new Map<string, CallIssue>();
  for (const session of recentSessionsResult.data ?? []) {
    if (callIssueByElderly.has(session.elderly_id)) continue;
    const name = session.elderly_profiles?.name ?? "tu familiar";

    if (session.status === "failed") {
      callIssueByElderly.set(session.elderly_id, {
        elderlyId: session.elderly_id,
        name,
        kind: "failed",
      });
    } else if (session.status === "no_answer") {
      callIssueByElderly.set(session.elderly_id, {
        elderlyId: session.elderly_id,
        name,
        kind: "no_answer",
      });
    } else if (session.status === "completed" && session.call_summaries.length === 0) {
      const minutesElapsed = minutesSince(session.started_at);
      // Under 2 hours: the summary is probably just still being generated.
      // Past that, the analysis call almost certainly failed outright and
      // nothing will retry it — say so plainly instead of promising a
      // summary that is never coming.
      if (minutesElapsed > 120) {
        callIssueByElderly.set(session.elderly_id, {
          elderlyId: session.elderly_id,
          name,
          kind: "analysis_failed",
        });
      } else if (minutesElapsed > 20) {
        callIssueByElderly.set(session.elderly_id, {
          elderlyId: session.elderly_id,
          name,
          kind: "processing",
        });
      }
    }
  }
  const callIssues = Array.from(callIssueByElderly.values());

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {greeting()}, {displayName}
          </h1>
          <LogoutButton />
        </div>

        {created === "success" && (
          <Reveal className="mt-8 flex items-center gap-3 rounded-2xl bg-secondary-light px-5 py-4">
            <CheckCircle className="animate-pop-in h-5 w-5 shrink-0 text-secondary" />
            <p className="text-base text-text-primary">
              Perfil creado. Empezaremos a llamar según el horario elegido.
            </p>
          </Reveal>
        )}

        {callIssues.length > 0 && (
          <div className="mt-8 space-y-3">
            {callIssues.map((issue, index) => {
              const copy = CALL_ISSUE_COPY[issue.kind];
              const Icon = copy.icon;
              const toneClasses =
                copy.tone === "warning"
                  ? "border-l-alert-warning bg-alert-warning-bg text-alert-warning"
                  : "border-l-alert-info bg-alert-info-bg text-alert-info";
              return (
                <Reveal key={issue.elderlyId} delay={index * 70}>
                  <div
                    className={`flex items-start gap-3 rounded-2xl border-l-4 p-4 shadow-soft ${toneClasses}`}
                  >
                    <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.75} />
                    <p className="text-base text-text-primary">
                      {copy.message(issue.name)}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}

        {alerts.length > 0 && (
          <div className="mt-8">
            <AlertsPanel initialAlerts={alerts} />
          </div>
        )}

        <div className="mt-12 space-y-5">
          {hasProfiles && (
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-text-muted">
                Cómo están
              </h2>
              <Link
                href="/profile/new"
                className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
              >
                + Añadir familiar
              </Link>
            </div>
          )}

          {!hasProfiles && (
            <Reveal delay={80}>
              <Card className="text-center">
                <UserPlus
                  className="mx-auto h-12 w-12 text-primary"
                  strokeWidth={1.5}
                />
                <p className="mt-4 text-lg text-text-secondary">
                  Aún no has añadido a nadie
                </p>
                <Link
                  href="/profile/new"
                  className={`${buttonBaseClasses} ${buttonVariantClasses.primary} mt-6 px-8 py-4 text-lg`}
                >
                  Añadir mi primer familiar
                </Link>
              </Card>
            </Reveal>
          )}

          {hasProfiles &&
            profiles!.map((profile, index) => {
              const subscription = latestSubscriptionByElderly.get(profile.id);
              const isActivePlan = subscription
                ? ACTIVE_STATUSES.has(subscription.status)
                : false;
              const issue = callIssueByElderly.get(profile.id);
              const latestCall = latestCallByElderly.get(profile.id);
              const summary = latestCall?.call_summaries[0];

              return (
                <Reveal key={profile.id} delay={index * 90}>
                  <Card className="transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-soft-md">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-lg font-semibold text-text-primary">
                        {profile.name}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          profile.active
                            ? "bg-secondary-light text-text-primary"
                            : "bg-surface-alt text-text-muted"
                        }`}
                      >
                        {profile.active && (
                          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
                        )}
                        {profile.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    {issue ? (
                      <p className="mt-3 text-base leading-relaxed text-text-secondary">
                        {CALL_ISSUE_COPY[issue.kind].message(profile.name)}
                      </p>
                    ) : summary ? (
                      <div className="mt-3">
                        <p className="text-base text-text-secondary">
                          Habló contigo {whenSpoke(latestCall.started_at)}.
                        </p>
                        <p className="mt-2 text-base leading-relaxed text-text-primary">
                          &ldquo;{summary.summary}&rdquo;
                        </p>
                        {summary.mood_detected && MOOD_CLOSING[summary.mood_detected] && (
                          <p className="mt-2 text-sm text-text-muted">
                            {MOOD_CLOSING[summary.mood_detected]}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-base text-text-secondary">
                        Aún no habéis tenido ninguna llamada
                        {profile.preferred_call_time
                          ? ` — la primera está programada a las ${profile.preferred_call_time.slice(0, 5)}`
                          : ""}
                        .
                      </p>
                    )}

                    <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                      {subscription ? (
                        <div className="flex items-center gap-2">
                          <PhoneCall
                            className="h-4 w-4 text-primary"
                            strokeWidth={1.75}
                          />
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              Plan {PLANS[subscription.plan_type].name}
                            </p>
                            <p
                              className={`text-sm ${
                                isActivePlan
                                  ? "text-text-muted"
                                  : "text-alert-warning"
                              }`}
                            >
                              {STATUS_LABELS[subscription.status] ??
                                subscription.status}
                            </p>
                          </div>
                        </div>
                      ) : familyHasRoom ? (
                        <AttachFamilyPlanButton elderlyId={profile.id} />
                      ) : (
                        <Link
                          href={`/pricing?elderlyId=${profile.id}`}
                          className="text-base font-medium text-primary transition-colors hover:text-primary-hover"
                        >
                          Elegir plan
                        </Link>
                      )}

                      <div className="flex items-center gap-2">
                        {subscription && <ManageSubscriptionButton />}
                        <Link
                          href={`/elderly/${profile.id}`}
                          className={`${buttonBaseClasses} ${buttonVariantClasses.ghost} px-3 py-2 text-sm`}
                        >
                          Ver más
                        </Link>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
        </div>
      </div>
    </div>
  );
}
