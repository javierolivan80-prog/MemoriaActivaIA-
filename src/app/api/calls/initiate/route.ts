import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { initiateCallForElderly } from "@/lib/calls/initiateCall";
import { getElderlyAccessRole } from "@/lib/access/elderlyAccess";
import { checkRateLimit } from "@/lib/rateLimit";

const InitiateCallSchema = z.object({
  elderlyId: z.uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const allowed = await checkRateLimit(user.id, "call_initiate", 5, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiadas llamadas iniciadas. Inténtalo de nuevo en un rato." },
      { status: 429 }
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = InitiateCallSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "El campo elderlyId es obligatorio" },
      { status: 400 }
    );
  }

  const { elderlyId } = parsed.data;

  const role = await getElderlyAccessRole(supabase, user.id, elderlyId);
  if (role !== "owner") {
    return NextResponse.json(
      { error: "No tienes permiso para iniciar llamadas para este perfil" },
      { status: 403 }
    );
  }

  const result = await initiateCallForElderly(supabase, elderlyId);

  if (!result.ok) {
    const status = result.error === "Perfil no encontrado" ? 404 : 502;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    callId: result.callId,
    sessionId: result.sessionId,
  });
}
