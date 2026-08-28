import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";
import EditProfileForm from "@/components/elderly/EditProfileForm";
import AccessPanel from "@/components/elderly/AccessPanel";
import type { ElderlyProfile } from "@/types";

export default async function EditElderlyProfilePage({
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

  const role = await getElderlyAccessRole(supabase, user.id, id);
  if (role !== "owner") {
    notFound();
  }

  const { data: profile } = await supabase
    .from("elderly_profiles")
    .select("*")
    .eq("id", id)
    .single<ElderlyProfile>();

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-text-primary">
          Editar perfil de {profile.name}
        </h1>
        <div className="mt-8">
          <EditProfileForm profile={profile} />
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <AccessPanel elderlyId={profile.id} />
        </div>
      </div>
    </div>
  );
}
