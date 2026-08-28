import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/service";

const CallAnalysisSchema = z.object({
  summary: z.string(),
  important_things: z.array(z.string()),
  mood: z.enum(["positivo", "neutral", "negativo", "preocupante"]),
  topics: z.array(z.string()),
  alert_level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  alert_message: z.string().nullable(),
});

const client = new Anthropic();

export async function POST(request: Request) {
  const internalSecret = request.headers.get("x-internal-secret");

  if (
    !internalSecret ||
    internalSecret !== process.env.INTERNAL_API_SECRET
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const sessionId = body?.sessionId;

  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json(
      { error: "El campo sessionId es obligatorio" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  const { data: session } = await supabase
    .from("conversation_sessions")
    .select("id, elderly_id, transcript")
    .eq("id", sessionId)
    .single();

  if (!session || !session.transcript) {
    return NextResponse.json(
      { error: "No hay transcripción disponible para esta sesión" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("elderly_profiles")
    .select("user_id, name")
    .eq("id", session.elderly_id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "No se encontró el perfil asociado a la sesión" },
      { status: 404 }
    );
  }

  let analysis;
  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      system:
        `Analizas la transcripción de una llamada telefónica de compañía hecha a ${profile.name}, una persona mayor, en español. ` +
        "Genera un resumen breve, la lista de cosas importantes mencionadas (salud, estado de ánimo, sucesos, nombres), el estado de ánimo detectado y los temas tratados. " +
        "Evalúa también si hay que alertar a la familia con un alert_level: " +
        "0 = todo normal, sin necesidad de alerta; " +
        "1 = leve (bajo de ánimo, alguna queja menor, algo de soledad); " +
        "2 = moderado (dolor, olvidos frecuentes, aislamiento notable, preocupación por su cuidado); " +
        "3 = grave (caída, no comer, confusión importante, angustia, riesgo para su seguridad). " +
        "Si alert_level es 0, alert_message debe ser null. Si es 1, 2 o 3, describe en alert_message qué ha pasado y por qué preocupa, en una o dos frases dirigidas a la familia.",
      messages: [
        { role: "user", content: `Transcripción de la llamada:\n\n${session.transcript}` },
      ],
      output_config: { format: zodOutputFormat(CallAnalysisSchema) },
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "No se pudo analizar la transcripción" },
        { status: 502 }
      );
    }

    analysis = response.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Error al llamar a la IA: ${error.message}` },
        { status: 502 }
      );
    }
    throw error;
  }

  await supabase.from("call_summaries").insert({
    session_id: session.id,
    summary: analysis.summary,
    important_things: analysis.important_things,
    topics_discussed: analysis.topics,
    mood_detected: analysis.mood,
  });

  await supabase
    .from("conversation_sessions")
    .update({ mood: analysis.mood })
    .eq("id", session.id);

  if (analysis.alert_level > 0) {
    await supabase.from("alerts").insert({
      elderly_id: session.elderly_id,
      user_id: profile.user_id,
      alert_level: analysis.alert_level,
      message: analysis.alert_message ?? analysis.summary,
      is_read: false,
    });
  }

  return NextResponse.json({ analysis });
}
