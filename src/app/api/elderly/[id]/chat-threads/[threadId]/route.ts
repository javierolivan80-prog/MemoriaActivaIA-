import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";

const RenameThreadSchema = z.object({
  title: z.string().trim().min(1).max(100),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  const { id, threadId } = await params;
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

  const rawBody = await request.json().catch(() => null);
  const parsed = RenameThreadSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "El título del chat no es válido" },
      { status: 400 }
    );
  }

  const { data: thread, error } = await supabase
    .from("family_chat_threads")
    .update({ title: parsed.data.title })
    .eq("id", threadId)
    .eq("elderly_id", id)
    .select("id, title, updated_at")
    .single();

  if (error || !thread) {
    return NextResponse.json(
      { error: "No se pudo renombrar el chat" },
      { status: 500 }
    );
  }

  return NextResponse.json({ thread });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  const { id, threadId } = await params;
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

  const { error } = await supabase
    .from("family_chat_threads")
    .delete()
    .eq("id", threadId)
    .eq("elderly_id", id);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar el chat" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
