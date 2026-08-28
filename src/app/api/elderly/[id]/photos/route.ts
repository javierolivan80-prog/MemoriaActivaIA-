import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";

const BUCKET = "elderly-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

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
  if (!role) {
    return NextResponse.json(
      { error: "No tienes acceso a este perfil" },
      { status: 404 }
    );
  }

  const { data: photos, error } = await supabase
    .from("memories_media")
    .select("*")
    .eq("elderly_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las fotos" },
      { status: 500 }
    );
  }

  const serviceClient = createServiceRoleClient();
  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data: signed } = await serviceClient.storage
        .from(BUCKET)
        .createSignedUrl(photo.image_url, SIGNED_URL_TTL_SECONDS);
      return {
        ...photo,
        signed_url: signed?.signedUrl ?? null,
        can_delete: photo.uploaded_by === user.id || role === "owner",
      };
    })
  );

  return NextResponse.json({ photos: photosWithUrls });
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
  if (!role) {
    return NextResponse.json(
      { error: "No tienes acceso a este perfil" },
      { status: 404 }
    );
  }

  const formData = await request.formData();
  const image = formData.get("image");
  const caption = formData.get("caption");
  const peopleInPhoto = formData.get("people_in_photo");

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  }
  if (typeof caption !== "string" || !caption.trim()) {
    return NextResponse.json({ error: "Falta la descripción" }, { status: 400 });
  }

  const extension = image.name.split(".").pop() ?? "jpg";
  const objectPath = `${id}/${randomUUID()}.${extension}`;

  const serviceClient = createServiceRoleClient();
  const arrayBuffer = await image.arrayBuffer();
  const { error: uploadError } = await serviceClient.storage
    .from(BUCKET)
    .upload(objectPath, arrayBuffer, {
      contentType: image.type || "image/jpeg",
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "No se pudo subir la foto" },
      { status: 500 }
    );
  }

  const { data: photo, error: insertError } = await supabase
    .from("memories_media")
    .insert({
      elderly_id: id,
      uploaded_by: user.id,
      image_url: objectPath,
      caption: caption.trim(),
      people_in_photo:
        typeof peopleInPhoto === "string" && peopleInPhoto.trim()
          ? peopleInPhoto.trim()
          : null,
    })
    .select("*")
    .single();

  if (insertError || !photo) {
    await serviceClient.storage.from(BUCKET).remove([objectPath]);
    return NextResponse.json(
      { error: "No se pudo guardar la foto" },
      { status: 500 }
    );
  }

  const { data: signed } = await serviceClient.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

  return NextResponse.json({
    photo: { ...photo, signed_url: signed?.signedUrl ?? null, can_delete: true },
  });
}
