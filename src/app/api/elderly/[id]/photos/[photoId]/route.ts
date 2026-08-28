import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";

const BUCKET = "elderly-photos";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await getElderlyAccessRole(supabase, user.id, id);
  if (!role) {
    return NextResponse.json(
      { error: "No tienes acceso a este perfil" },
      { status: 404 }
    );
  }

  const { data: photo } = await supabase
    .from("memories_media")
    .select("id, uploaded_by, image_url")
    .eq("id", photoId)
    .eq("elderly_id", id)
    .single();

  if (!photo) {
    return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  if (photo.uploaded_by !== user.id && role !== "owner") {
    return NextResponse.json(
      { error: "No puedes eliminar esta foto" },
      { status: 403 }
    );
  }

  const serviceClient = createServiceRoleClient();
  await serviceClient.storage.from(BUCKET).remove([photo.image_url]);

  const { error: deleteError } = await supabase
    .from("memories_media")
    .delete()
    .eq("id", photoId);

  if (deleteError) {
    return NextResponse.json(
      { error: "No se pudo eliminar la foto" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
