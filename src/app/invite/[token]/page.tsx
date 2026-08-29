import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import EntryShell from "@/components/layout/EntryShell";
import InviteAuthPrompt from "@/components/invite/InviteAuthPrompt";
import AcceptInviteButton from "@/components/invite/AcceptInviteButton";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <EntryShell>
        <InviteAuthPrompt token={token} />
      </EntryShell>
    );
  }

  const { data: invite } = await supabase
    .from("elderly_profile_access")
    .select("elderly_id, invited_email, invited_by, status")
    .eq("invite_token", token)
    .maybeSingle();

  if (!invite) {
    notFound();
  }

  if (invite.status === "accepted") {
    redirect(`/elderly/${invite.elderly_id}`);
  }

  if (invite.invited_email !== user.email) {
    return (
      <EntryShell>
        <h1 className="font-serif text-3xl text-text-primary">
          Esta invitación es para otro email
        </h1>
        <p className="mt-3 text-text-secondary">
          La invitación se envió a {invite.invited_email}. Inicia sesión con
          esa cuenta para aceptarla.
        </p>
      </EntryShell>
    );
  }

  const serviceClient = createServiceRoleClient();

  // The invitee has no accepted access yet, so RLS blocks the RLS-scoped
  // client from reading the profile. We've already verified this invite row
  // belongs to the authenticated user's email above, so it's safe to reveal
  // just the elderly's name via the service role client here.
  const { data: elderlyProfile } = await serviceClient
    .from("elderly_profiles")
    .select("name")
    .eq("id", invite.elderly_id)
    .single();

  const { data: inviter } = await serviceClient.auth.admin.getUserById(
    invite.invited_by
  );

  return (
    <EntryShell>
      <h1 className="font-serif text-3xl leading-tight text-text-primary">
        {inviter.user?.email ?? "Un familiar"} te ha invitado a ver el
        perfil de {elderlyProfile?.name ?? "un familiar"}
      </h1>
      <div className="mt-6">
        <AcceptInviteButton token={token} elderlyId={invite.elderly_id} />
      </div>
    </EntryShell>
  );
}
