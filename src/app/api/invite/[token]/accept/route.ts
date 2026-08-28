import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: invite } = await supabase
    .from("elderly_profile_access")
    .select("id, elderly_id, invited_email, status")
    .eq("invite_token", token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json(
      { error: "Invitación no encontrada" },
      { status: 404 }
    );
  }

  if (invite.status === "accepted") {
    return NextResponse.json({ elderlyId: invite.elderly_id });
  }

  if (invite.invited_email !== user.email) {
    return NextResponse.json(
      { error: "Esta invitación es para otro email" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("elderly_profile_access")
    .update({ user_id: user.id, status: "accepted" })
    .eq("id", invite.id);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo aceptar la invitación" },
      { status: 500 }
    );
  }

  return NextResponse.json({ elderlyId: invite.elderly_id });
}
