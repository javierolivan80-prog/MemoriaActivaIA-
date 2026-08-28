import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle, PhoneCall, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";
import AlertsPanel, { type AlertItem } from "@/components/dashboard/AlertsPanel";
import ManageSubscriptionButton from "@/components/dashboard/ManageSubscriptionButton";
import Card from "@/components/ui/Card";
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

  const { data: profiles } = await supabase
    .from("elderly_profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<ElderlyProfile[]>();

  const hasProfiles = (profiles?.length ?? 0) > 0;

  const { data: alertRows } = await supabase
    .from("alerts")
    .select("id, message, alert_level, created_at, elderly_profiles(name)")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .returns<AlertRow[]>();

  const alerts: AlertItem[] = (alertRows ?? []).map((row) => ({
    id: row.id,
    message: row.message,
    alert_level: row.alert_level,
    created_at: row.created_at,
    elderly_name: row.elderly_profiles?.name ?? "Familiar",
  }));

  const { data: subscriptionRows } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Subscription[]>();

  const latestSubscriptionByElderly = new Map<string, Subscription>();
  for (const subscription of subscriptionRows ?? []) {
    if (!latestSubscriptionByElderly.has(subscription.elderly_id)) {
      latestSubscriptionByElderly.set(subscription.elderly_id, subscription);
    }
  }

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
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-secondary-light px-5 py-4">
            <CheckCircle className="h-5 w-5 shrink-0 text-secondary" />
            <p className="text-base text-text-primary">
              Perfil creado. Empezaremos a llamar según el horario elegido.
            </p>
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
          )}

          {hasProfiles && (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {profiles!.map((profile) => {
                const subscription = latestSubscriptionByElderly.get(
                  profile.id
                );
                const isActivePlan = subscription
                  ? ACTIVE_STATUSES.has(subscription.status)
                  : false;

                return (
                  <Card key={profile.id}>
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
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          profile.active
                            ? "bg-secondary-light text-secondary"
                            : "bg-surface-alt text-text-muted"
                        }`}
                      >
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
                          className="text-base font-medium text-primary"
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
