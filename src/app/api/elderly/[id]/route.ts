import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";
import { isValidSpanishPhone } from "@/lib/validation";

const stringList = z.array(z.string().trim().max(200)).max(50);

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1).max(200),
  age: z.number().int().min(0).max(130).nullable(),
  phone_number: z
    .string()
    .trim()
    .refine(isValidSpanishPhone, "Número de teléfono español no válido"),
  active: z.boolean(),
  family_info: z.record(z.string(), z.unknown()),
  interests: stringList,
  hobbies: stringList,
  routines: stringList,
  favorite_topics: stringList,
  sensitive_topics: stringList,
});

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

  const rawBody = await request.json().catch(() => null);
  const parsed = UpdateProfileSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de perfil no válidos" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("elderly_profiles")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo guardar el perfil" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
