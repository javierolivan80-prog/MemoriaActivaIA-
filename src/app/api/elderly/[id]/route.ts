import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";

export async function PATCH(
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
      { error: "No tienes permiso para editar este perfil" },
      { status: 403 }
    );
  }

  const body = await request.json();

  const { error } = await supabase
    .from("elderly_profiles")
    .update({
      name: body.name,
      age: body.age,
      phone_number: body.phone_number,
      active: body.active,
      family_info: body.family_info,
      interests: body.interests,
      hobbies: body.hobbies,
      routines: body.routines,
      favorite_topics: body.favorite_topics,
      sensitive_topics: body.sensitive_topics,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo guardar el perfil" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
