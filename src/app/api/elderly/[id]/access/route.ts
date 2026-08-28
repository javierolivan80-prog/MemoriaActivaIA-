import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";
import { sendInviteEmail } from "@/lib/email/resend";

const InviteSchema = z.object({
  email: z.email().max(255),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await getElderlyAccessRole(supabase, user.id, id);
  if (role !== "owner") {
    return NextResponse.json(
      { error: "No tienes permiso para ver esto" },
      { status: 403 }
    );
  }

  const { data: accessRows, error } = await supabase
    .from("elderly_profile_access")
    .select("id, user_id, invited_email, role, status, created_at")
    .eq("elderly_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cargar la lista de acceso" },
      { status: 500 }
    );
  }

  const serviceClient = createServiceRoleClient();
  const rowsWithEmail = await Promise.all(
    (accessRows ?? []).map(async (row) => {
      const { invited_email, ...rest } = row;
      const publicRest = {
        id: rest.id,
        role: rest.role,
        status: rest.status,
        created_at: rest.created_at,
      };
      if (invited_email) {
        return { ...publicRest, email: invited_email };
      }
      if (row.user_id) {
        const { data } = await serviceClient.auth.admin.getUserById(
          row.user_id
        );
        return { ...publicRest, email: data.user?.email ?? null };
      }
      return { ...publicRest, email: null };
    })
  );

  return NextResponse.json({ access: rowsWithEmail });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await getElderlyAccessRole(supabase, user.id, id);
  if (role !== "owner") {
    return NextResponse.json(
      { error: "No tienes permiso para invitar" },
      { status: 403 }
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = InviteSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Introduce un email válido" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("elderly_profile_access")
    .select("id")
    .eq("elderly_id", id)
    .eq("invited_email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una invitación para ese email" },
      { status: 409 }
    );
  }

  const { data: invite, error: insertError } = await supabase
    .from("elderly_profile_access")
    .insert({
      elderly_id: id,
      invited_email: email,
      role: "viewer",
      invited_by: user.id,
      status: "pending",
    })
    .select("*")
    .single();

  if (insertError || !invite) {
    return NextResponse.json(
      { error: "No se pudo crear la invitación" },
      { status: 500 }
    );
  }

  const { data: profile } = await supabase
    .from("elderly_profiles")
    .select("name")
    .eq("id", id)
    .single();

  try {
    await sendInviteEmail({
      to: email,
      inviterEmail: user.email ?? "Un familiar",
      elderlyName: profile?.name ?? "un familiar",
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.invite_token}`,
    });
  } catch (err) {
    console.error("No se pudo enviar el email de invitación", err);
  }

  return NextResponse.json({ access: { ...invite, email } });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await getElderlyAccessRole(supabase, user.id, id);
  if (role !== "owner") {
    return NextResponse.json(
      { error: "No tienes permiso para eliminar accesos" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const accessId = searchParams.get("accessId");

  if (!accessId) {
    return NextResponse.json(
      { error: "Falta el identificador del acceso" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("elderly_profile_access")
    .delete()
    .eq("id", accessId)
    .eq("elderly_id", id);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar el acceso" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
