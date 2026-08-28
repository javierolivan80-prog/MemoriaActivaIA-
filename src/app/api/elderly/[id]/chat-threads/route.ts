import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";

const CreateThreadSchema = z.object({
  title: z.string().trim().min(1).max(100),
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
  if (!role) {
    return NextResponse.json(
      { error: "No tienes acceso a este perfil" },
      { status: 404 }
    );
  }

  const { data: threads, error } = await supabase
    .from("family_chat_threads")
    .select(
      "id, title, updated_at, family_chat_messages(content, role, created_at)"
    )
    .eq("elderly_id", id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar los chats" },
      { status: 500 }
    );
  }

  const result = (threads ?? []).map((thread) => {
    const messages = [...thread.family_chat_messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const lastMessage = messages[messages.length - 1] ?? null;
    return {
      id: thread.id,
      title: thread.title,
      updated_at: thread.updated_at,
      last_message_preview: lastMessage?.content ?? null,
    };
  });

  return NextResponse.json({ threads: result });
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

  const rawBody = await request.json().catch(() => null);
  const parsed = CreateThreadSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "El título del chat no es válido" },
      { status: 400 }
    );
  }

  const { data: thread, error } = await supabase
    .from("family_chat_threads")
    .insert({
      elderly_id: id,
      title: parsed.data.title,
      created_by: user.id,
    })
    .select("id, title, updated_at")
    .single();

  if (error || !thread) {
    return NextResponse.json(
      { error: "No se pudo crear el chat" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    thread: { ...thread, last_message_preview: null },
  });
}
