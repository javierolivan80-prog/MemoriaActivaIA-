import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";
import AlertsPanel, { type AlertItem } from "@/components/dashboard/AlertsPanel";
import type { ElderlyProfile } from "@/types";

interface AlertRow {
  id: string;
  message: string;
  alert_level: 1 | 2 | 3;
  created_at: string;
  elderly_profiles: { name: string } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profiles } = await supabase
    .from("elderly_profiles")
    .select("*")
    .eq("user_id", user.id)
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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            MEMORIA ACTIVA
          </h1>
          <LogoutButton />
        </div>

        <div className="mt-12">
          <AlertsPanel initialAlerts={alerts} />
        </div>

        <div className="mt-12">
          {!hasProfiles && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="text-lg text-gray-600">
                Todavía no has añadido a ningún familiar.
              </p>
              <Link
                href="/profile/new"
                className="mt-6 inline-block rounded-lg bg-gray-900 px-6 py-3 text-lg font-medium text-white transition hover:bg-gray-800"
              >
                Añadir familiar
              </Link>
            </div>
          )}

          {hasProfiles && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Tus familiares
                </h2>
                <Link
                  href="/profile/new"
                  className="text-base font-medium text-gray-900 underline underline-offset-4"
                >
                  + Añadir familiar
                </Link>
              </div>

              <ul className="mt-6 space-y-4">
                {profiles!.map((profile) => (
                  <li
                    key={profile.id}
                    className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm"
                  >
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {profile.name}
                      </p>
                      <p className="text-base text-gray-600">
                        {profile.age
                          ? `${profile.age} años`
                          : "Edad sin especificar"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-4 py-1 text-sm font-medium ${
                        profile.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {profile.active ? "Activo" : "Inactivo"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
