import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateCallForElderly } from "@/lib/calls/initiateCall";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const elderlyId = body?.elderlyId;

  if (typeof elderlyId !== "string" || !elderlyId) {
    return NextResponse.json(
      { error: "El campo elderlyId es obligatorio" },
      { status: 400 }
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
