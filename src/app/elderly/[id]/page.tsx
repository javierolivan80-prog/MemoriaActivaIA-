import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import type { ElderlyProfile } from "@/types";

function familyInfoText(familyInfo: Record<string, unknown>): string {
  if (typeof familyInfo.description === "string" && familyInfo.description) {
    return familyInfo.description;
  }
  return "Sin información registrada.";
}

function listOrFallback(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "Sin información registrada.";
}

export default async function ElderlyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("elderly_profiles")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<ElderlyProfile>();

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>

        <h1 className="mt-6 font-serif text-3xl text-text-primary">
          {profile.name}
        </h1>

        <div className="mt-8 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-text-primary">
              Datos básicos
            </h2>
            <dl className="mt-4 space-y-3 text-base">
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Edad</dt>
                <dd className="text-text-primary">
                  {profile.age ? `${profile.age} años` : "Sin especificar"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Teléfono</dt>
                <dd className="text-text-primary">{profile.phone_number}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Hora de llamada</dt>
                <dd className="text-text-primary">
                  {profile.preferred_call_time
                    ? profile.preferred_call_time.slice(0, 5)
                    : "11:00 (por defecto)"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Estado</dt>
                <dd className="text-text-primary">
                  {profile.active ? "Activo" : "Inactivo"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-text-primary">
              Familia
            </h2>
            <p className="mt-3 text-base leading-relaxed text-text-secondary">
              {familyInfoText(profile.family_info)}
            </p>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-text-primary">
              Personalidad
            </h2>
            <dl className="mt-4 space-y-3 text-base">
              <div>
                <dt className="font-medium text-text-primary">
                  Intereses y hobbies
                </dt>
                <dd className="mt-1 text-text-secondary">
                  {listOrFallback([...profile.interests, ...profile.hobbies])}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-text-primary">Rutina</dt>
                <dd className="mt-1 text-text-secondary">
                  {listOrFallback(profile.routines)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-text-primary">
                  Temas favoritos
                </dt>
                <dd className="mt-1 text-text-secondary">
                  {listOrFallback(profile.favorite_topics)}
                </dd>
              </div>
            </dl>
          </Card>

          {profile.sensitive_topics.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-text-primary">
                Temas sensibles
              </h2>
              <p className="mt-3 text-base leading-relaxed text-text-secondary">
                {listOrFallback(profile.sensitive_topics)}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
