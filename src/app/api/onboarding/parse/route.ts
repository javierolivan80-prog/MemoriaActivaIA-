import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ExtractedProfileSchema = z.object({
  name: z.string(),
  age: z.number().int().nullable(),
  phone_number: z.string().nullable(),
  family_info: z.string(),
  interests: z.array(z.string()),
  hobbies: z.array(z.string()),
  routines: z.array(z.string()),
  favorite_topics: z.array(z.string()),
  sensitive_topics: z.array(z.string()),
});

const client = new Anthropic();

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const transcript = body?.transcript;

  if (typeof transcript !== "string" || !transcript.trim()) {
    return NextResponse.json(
      { error: "El campo transcript es obligatorio" },
      { status: 400 }
    );
  }

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      system:
        "Extraes datos estructurados sobre una persona mayor a partir de una descripción libre escrita por un familiar, en español. " +
        "Usa null para datos numéricos o de texto no mencionados, y listas vacías para categorías no mencionadas. No inventes información que no esté en el texto.",
      messages: [{ role: "user", content: transcript }],
      output_config: { format: zodOutputFormat(ExtractedProfileSchema) },
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "No se pudo procesar el texto" },
        { status: 502 }
      );
    }

    return NextResponse.json(response.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Error al llamar a la IA: ${error.message}` },
        { status: 502 }
      );
    }
    throw error;
  }
}
