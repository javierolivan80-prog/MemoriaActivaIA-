import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { initiateCallForElderly } from "@/lib/calls/initiateCall";

const ScheduledTriggerSchema = z.object({
  elderlyId: z.uuid(),
});

const SCHEDULABLE_STATUSES = ["active", "trialing"];

async function verifyQstashSignature(
  request: Request,
  rawBody: string
): Promise<boolean> {
  const signature = request.headers.get("upstash-signature");
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!signature || !currentSigningKey || !nextSigningKey) return false;

  const receiver = new Receiver({ currentSigningKey, nextSigningKey });
  try {
    return await receiver.verify({ signature, body: rawBody });
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!(await verifyQstashSignature(request, rawBody))) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const parsedBody = JSON.parse(rawBody);
  const parsed = ScheduledTriggerSchema.safeParse(parsedBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "El campo elderlyId es obligatorio" },
      { status: 400 }
    );
  }

  const { elderlyId } = parsed.data;
  const supabase = createServiceRoleClient();

  // Re-check eligibility at execution time, not just at this-morning's
  // scheduling time — a subscription can be cancelled or a profile paused
  // in the hours between "we scheduled this call" and "it's time to place
  // it", and we must not call someone whose plan lapsed since this morning.
  const [{ data: profile }, { data: subscriptions }] = await Promise.all([
    supabase
      .from("elderly_profiles")
      .select("active")
      .eq("id", elderlyId)
      .single(),
    supabase
      .from("subscriptions")
      .select("status")
      .eq("elderly_id", elderlyId)
      .in("status", SCHEDULABLE_STATUSES)
      .limit(1),
  ]);

  if (!profile?.active || !subscriptions || subscriptions.length === 0) {
    return NextResponse.json({
      skipped: true,
      reason: "ya no es elegible para llamadas (perfil inactivo o suscripción no vigente)",
    });
  }

  const result = await initiateCallForElderly(supabase, elderlyId);

  if (!result.ok) {
    // Non-2xx tells QStash to retry per its configured retry policy — this
    // failure might be transient (Retell hiccup), so let it retry rather
    // than silently drop the scheduled call.
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ callId: result.callId, sessionId: result.sessionId });
}
