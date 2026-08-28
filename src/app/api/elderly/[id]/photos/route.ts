import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";

const BUCKET = "elderly-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Verifies the file's real content by magic bytes, not just the
// client-supplied Content-Type (which is trivially spoofable).
function sniffImageMimeType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

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
    .select("id, uploaded_by, image_url, caption, people_in_photo, created_at")
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
        id: photo.id,
        caption: photo.caption,
        people_in_photo: photo.people_in_photo,
        created_at: photo.created_at,
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
  if (role !== "owner") {
    return NextResponse.json(
      { error: "No tienes permiso para añadir fotos" },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const image = formData.get("image");
  const caption = formData.get("caption");
  const peopleInPhoto = formData.get("people_in_photo");

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  }
  if (
    typeof peopleInPhoto === "string" &&
    peopleInPhoto.trim().length > 300
  ) {
    return NextResponse.json(
      { error: "El campo 'quién aparece' es demasiado largo" },
      { status: 400 }
    );
  }
  if (typeof caption !== "string" || !caption.trim()) {
    return NextResponse.json({ error: "Falta la descripción" }, { status: 400 });
  }
  if (caption.trim().length > 500) {
    return NextResponse.json(
      { error: "La descripción es demasiado larga" },
      { status: 400 }
    );
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "La foto no puede superar los 5MB" },
      { status: 400 }
    );
  }

  const arrayBuffer = await image.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const realMimeType = sniffImageMimeType(bytes);

  if (!realMimeType || !ALLOWED_IMAGE_TYPES[realMimeType]) {
    return NextResponse.json(
      { error: "Solo se permiten imágenes JPEG, PNG o WEBP" },
      { status: 400 }
    );
  }

  const extension = ALLOWED_IMAGE_TYPES[realMimeType];
  const objectPath = `${id}/${randomUUID()}.${extension}`;

  const serviceClient = createServiceRoleClient();
  const { error: uploadError } = await serviceClient.storage
    .from(BUCKET)
    .upload(objectPath, arrayBuffer, {
      contentType: realMimeType,
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
    .select("id, caption, people_in_photo, created_at")
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
