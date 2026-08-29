import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle, Clock, PhoneCall, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";
import AlertsPanel, { type AlertItem } from "@/components/dashboard/AlertsPanel";
import ManageSubscriptionButton from "@/components/dashboard/ManageSubscriptionButton";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";
import { PLANS } from "@/lib/stripe/plans";
import type { ElderlyProfile, Subscription } from "@/types";

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

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function minutesSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 60_000;
}

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

  const [profilesResult, alertsResult, subscriptionsResult, recentSessionsResult] =
    await Promise.all([
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
    if (!latestSubscriptionByElderly.has(subscription.elderly_id)) {
      latestSubscriptionByElderly.set(subscription.elderly_id, subscription);
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
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-text-primary">
            Hola {displayName}
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

        <div className="mt-12">
          <AlertsPanel initialAlerts={alerts} />
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary">
              Tus familiares
            </h2>
            {hasProfiles && (
              <Link
                href="/profile/new"
                className={`${buttonBaseClasses} ${buttonVariantClasses.primary} px-4 py-2 text-sm`}
              >
                + Añadir familiar
              </Link>
            )}
          </div>

          {!hasProfiles && (
            <Reveal delay={80}>
              <Card className="mt-6 text-center">
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

          {hasProfiles && (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {profiles!.map((profile, index) => {
                const subscription = latestSubscriptionByElderly.get(
                  profile.id
                );
                const isActivePlan = subscription
                  ? ACTIVE_STATUSES.has(subscription.status)
                  : false;

                return (
                  <Reveal key={profile.id} delay={index * 80}>
                    <Card className="transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-soft-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xl font-semibold text-text-primary">
                            {profile.name}
                          </p>
                          <p className="text-base text-text-secondary">
                            {profile.age
                              ? `${profile.age} años`
                              : "Edad sin especificar"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
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
                            Ver detalles
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
