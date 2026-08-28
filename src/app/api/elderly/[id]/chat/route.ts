import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";
import { getPreferredName } from "@/lib/phone/retell";
import { checkRateLimit } from "@/lib/rateLimit";
import type { ElderlyProfile } from "@/types";

const client = new Anthropic();

const ChatMessageSchema = z.object({
  message: z.string().trim().min(1).max(1000),
});

function buildSystemPrompt(preferredName: string): string {
  return `Eres un asistente cálido y cercano que ayuda a la familia de ${preferredName} a estar al tanto de cómo está, basándote en las conversaciones telefónicas reales que ha tenido con nuestra IA de compañía.

Tu tono debe ser el de alguien de confianza que conoce bien a ${preferredName} y que informa a la familia con cariño genuino — nunca clínico, nunca robótico, nunca uses frases como 'según los datos' o 'el sistema registra'. Habla como lo haría un cuidador cercano y observador.

Basa tus respuestas ÚNICAMENTE en la información real proporcionada sobre las llamadas y memorias — nunca inventes detalles, citas textuales, o eventos que no estén en el contexto que se te da. Si no tienes información suficiente para responder algo, dilo con naturalidad, ej: 'La verdad es que de eso no hemos hablado todavía, pero se lo puedo preguntar en la próxima llamada' — nunca finjas saber algo que no está en los datos.

Si detectas que la familia pregunta por algo médico serio o urgente, recuérdales amablemente que esto es un servicio de compañía y que ante cualquier duda de salud real deben contactar con un profesional médico.

Mantén las respuestas breves y conversacionales (2-4 frases normalmente), como un mensaje de WhatsApp a un familiar, no como un informe.`;
}

function buildContextBlock({
  profile,
  sessions,
  photos,
}: {
  profile: ElderlyProfile;
  sessions: Array<{
    started_at: string;
    duration_seconds: number | null;
    call_summaries: {
      summary: string;
      mood_detected: string | null;
      topics_discussed: string[];
    }[];
  }>;
  photos: Array<{ caption: string; people_in_photo: string | null }>;
}): string {
  const lines: string[] = [];

  lines.push(`PERFIL DE ${profile.name.toUpperCase()}:`);
  if (profile.age) lines.push(`- Edad: ${profile.age} años`);
  const interests = Array.from(new Set([...profile.interests, ...profile.hobbies]));
  if (interests.length > 0) lines.push(`- Intereses y hobbies: ${interests.join(", ")}`);
  if (profile.routines.length > 0) lines.push(`- Rutina: ${profile.routines.join(", ")}`);

  lines.push("");
  lines.push("LLAMADAS TELEFÓNICAS RECIENTES:");
  if (sessions.length === 0) {
    lines.push("(Todavía no ha recibido ninguna llamada)");
  }
  for (const session of sessions) {
    const summary = session.call_summaries[0];
    const date = new Date(session.started_at).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
    });
    if (summary) {
      lines.push(
        `- ${date} (ánimo: ${summary.mood_detected ?? "sin analizar"}): ${summary.summary} [Temas: ${summary.topics_discussed.join(", ")}]`
      );
    } else {
      lines.push(`- ${date}: llamada realizada, sin resumen disponible todavía.`);
    }
  }

  if (photos.length > 0) {
    lines.push("");
    lines.push("FOTOS Y RECUERDOS COMPARTIDOS RECIENTEMENTE POR LA FAMILIA:");
    for (const photo of photos) {
      const people = photo.people_in_photo ? ` (con ${photo.people_in_photo})` : "";
      lines.push(`- ${photo.caption}${people}`);
    }
  }

  return lines.join("\n");
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

  const { data: messages, error } = await supabase
    .from("family_chat_messages")
    .select("*")
    .eq("elderly_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cargar el chat" },
      { status: 500 }
    );
  }

  return NextResponse.json({ messages: messages ?? [] });
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

  const allowed = await checkRateLimit(user.id, "family_chat", 30, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados mensajes. Inténtalo de nuevo en un rato." },
      { status: 429 }
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = ChatMessageSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "El mensaje no es válido (máximo 1000 caracteres)" },
      { status: 400 }
    );
  }

  const message = parsed.data.message;

  const { data: profile } = await supabase
    .from("elderly_profiles")
    .select("*")
    .eq("id", id)
    .single<ElderlyProfile>();

  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const [{ data: sessions }, { data: photos }, { data: recentHistory }] =
    await Promise.all([
      supabase
        .from("conversation_sessions")
        .select("started_at, duration_seconds, call_summaries(*)")
        .eq("elderly_id", id)
        .order("started_at", { ascending: false })
        .limit(15),
      supabase
        .from("memories_media")
        .select("caption, people_in_photo")
        .eq("elderly_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("family_chat_messages")
        .select("role, content")
        .eq("elderly_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const { error: insertUserError } = await supabase
    .from("family_chat_messages")
    .insert({ elderly_id: id, user_id: user.id, role: "user", content: message });

  if (insertUserError) {
    return NextResponse.json(
      { error: "No se pudo guardar el mensaje" },
      { status: 500 }
    );
  }

  const preferredName = getPreferredName(profile);
  const contextBlock = buildContextBlock({
    profile,
    sessions: sessions ?? [],
    photos: photos ?? [],
  });

  const history = (recentHistory ?? [])
    .slice()
    .reverse()
    .map((row) => ({
      role: row.role as "user" | "assistant",
      content: row.content,
    }));

  let assistantReply: string;
  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 500,
      system: `${buildSystemPrompt(preferredName)}\n\n${contextBlock}`,
      messages: [...history, { role: "user", content: message }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    assistantReply =
      textBlock && textBlock.type === "text"
        ? textBlock.text
        : "Lo siento, no he podido responder ahora mismo.";
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Error al llamar a la IA: ${error.message}` },
        { status: 502 }
      );
    }
    throw error;
  }

  const { data: assistantMessage, error: insertAssistantError } = await supabase
    .from("family_chat_messages")
    .insert({
      elderly_id: id,
      user_id: null,
      role: "assistant",
      content: assistantReply,
    })
    .select("*")
    .single();

  if (insertAssistantError || !assistantMessage) {
    return NextResponse.json(
      { error: "No se pudo guardar la respuesta" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: assistantMessage });
}
